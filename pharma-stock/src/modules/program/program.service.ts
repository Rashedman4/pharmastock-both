import pool from "@/lib/db";
import { getStripeClient, toStripeUnitAmount } from "@/lib/stripe";
import { SimplePriceCacheService } from "@/modules/program/price-cache.service";

const displayNameSql = `NULLIF(TRIM(CONCAT(COALESCE(u.firstname, ''), ' ', COALESCE(u.lastname, ''))), '')`;

function toNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDecision(decision: string) {
  const normalized = String(decision || "")
    .trim()
    .toUpperCase();
  if (!["ACCEPTED", "REJECTED"].includes(normalized)) {
    throw new Error("Invalid decision");
  }
  return normalized as "ACCEPTED" | "REJECTED";
}

function randomReferralCode(partnerId: number) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PR${partnerId}${random}`;
}

async function getActiveFeeSettings() {
  const { rows } = await pool.query(
    `SELECT firm_profit_share_percent, partner_profit_share_percent
     FROM elite_fee_settings
     WHERE is_active = true
     LIMIT 1`,
  );
  return {
    firmPercent: toNumber(rows[0]?.firm_profit_share_percent, 15),
    partnerPercent: toNumber(rows[0]?.partner_profit_share_percent, 5),
  };
}

function normalizeIban(iban: string) {
  return String(iban || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

function cleanText(value: unknown, maxLength = 500) {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

function generateManualFirmProfitReference(memberId: number, paymentId: number) {
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ELITE-${memberId}-PAY-${paymentId}-${random}`;
}

export class ProgramService {
  private priceCache = new SimplePriceCacheService();
  async listApprovedPartnersForManualAttach(query?: string | null) {
    const values: any[] = [];
    let where = `WHERE pa.status = 'APPROVED'`;

    if (query?.trim()) {
      values.push(`%${query.trim()}%`);
      where += `
      AND (
        pa.display_name ILIKE $1 OR
        u.email ILIKE $1 OR
        u.firstname ILIKE $1 OR
        u.lastname ILIKE $1 OR
        pa.referral_code ILIKE $1
      )
    `;
    }

    const { rows } = await pool.query(
      `SELECT
        pa.id,
        pa.display_name AS "displayName",
        pa.referral_code AS "referralCode",
        u.email
     FROM partner_accounts pa
     JOIN users u ON u.id = pa.user_id
     ${where}
     ORDER BY pa.approved_at DESC NULLS LAST, pa.id DESC
     LIMIT 50`,
      values,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      displayName: row.displayName,
      referralCode: row.referralCode,
      email: row.email,
    }));
  }
  async getPartnerAccountByUserId(userId: number) {
    const { rows } = await pool.query(
      `SELECT id,
              user_id AS "userId",
              status,
              display_name AS "displayName",
              phone_number AS "phoneNumber",
              bio,
              referral_code AS "referralCode",
              iban,
              review_note AS "reviewNote",
              reviewed_at AS "reviewedAt",
              approved_at AS "approvedAt",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
       FROM partner_accounts
       WHERE user_id = $1
       LIMIT 1`,
      [userId],
    );
    return rows[0] ?? null;
  }

  async upsertPartnerApplication(
    userId: number,
    payload: { displayName: string; phoneNumber: string; bio: string },
  ) {
    const displayName = payload.displayName.trim();
    const phoneNumber = payload.phoneNumber.trim();
    const bio = payload.bio.trim();

    if (!displayName || !phoneNumber || !bio) {
      throw new Error("Missing required partner fields");
    }

    const existing = await this.getPartnerAccountByUserId(userId);
    if (!existing) {
      const { rows } = await pool.query(
        `INSERT INTO partner_accounts (
           user_id,
           status,
           display_name,
           phone_number,
           bio,
           created_at,
           updated_at
         ) VALUES ($1, 'PENDING', $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [userId, displayName, phoneNumber, bio],
      );
      return { id: rows[0]?.id, status: "PENDING" };
    }

    if (existing.status === "APPROVED") {
      throw new Error("Partner account already approved");
    }

    await pool.query(
      `UPDATE partner_accounts
       SET display_name = $2,
           phone_number = $3,
           bio = $4,
           status = 'PENDING',
           review_note = NULL,
           reviewed_by = NULL,
           reviewed_at = NULL,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId, displayName, phoneNumber, bio],
    );

    return { id: existing.id, status: "PENDING" };
  }

  async validatePartnerReferralCode(code: string) {
    const normalizedCode = String(code || "")
      .trim()
      .toUpperCase();
    if (!normalizedCode) return null;

    const { rows } = await pool.query(
      `SELECT id,
              display_name AS "displayName",
              referral_code AS "referralCode"
       FROM partner_accounts
       WHERE referral_code = $1
         AND status = 'APPROVED'
       LIMIT 1`,
      [normalizedCode],
    );

    return rows[0] ?? null;
  }

  async submitEliteApplication(
    userId: number,
    payload: {
      phoneNumber: string;
      investmentAmount: number;
      description?: string | null;
    },
    referralCode?: string | null,
  ) {
    const phoneNumber = String(payload.phoneNumber || "").trim();
    const investmentAmount = toNumber(payload.investmentAmount);
    const description = payload.description?.trim() || null;

    if (!phoneNumber) throw new Error("Phone number is required");
    if (!investmentAmount || investmentAmount < 100000) {
      throw new Error("Minimum required capital is 100000");
    }

    const activeExisting = await pool.query(
      `SELECT id, status
       FROM elite_applications
       WHERE user_id = $1
         AND status IN ('PENDING', 'APPROVED')
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );

    if (activeExisting.rows[0]) {
      throw new Error("You already have an active elite application");
    }

    let partnerAccountId: number | null = null;
    let normalizedReferralCode: string | null = null;

    if (referralCode) {
      const partner = await this.validatePartnerReferralCode(referralCode);
      if (partner) {
        const ownPartner = await this.getPartnerAccountByUserId(userId);
        if (!ownPartner || ownPartner.id !== partner.id) {
          partnerAccountId = Number(partner.id);
          normalizedReferralCode = String(partner.referralCode);
        }
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const insert = await client.query(
        `INSERT INTO elite_applications (
           user_id,
           phone_number,
           investment_amount,
           description,
           status,
           partner_account_id,
           referral_code_used,
           applied_from_referral,
           created_at,
           updated_at
         ) VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, NOW(), NOW())
         RETURNING id`,
        [
          userId,
          phoneNumber,
          investmentAmount,
          description,
          partnerAccountId,
          normalizedReferralCode,
          Boolean(partnerAccountId),
        ],
      );

      const applicationId = Number(insert.rows[0].id);

      if (partnerAccountId) {
        await client.query(
          `INSERT INTO partner_investor_links (
             partner_account_id,
             investor_user_id,
             elite_application_id,
             referral_code_used,
             status,
             linked_at,
             created_at,
             updated_at
           ) VALUES ($1, $2, $3, $4, 'PENDING', NOW(), NOW(), NOW())
           ON CONFLICT (investor_user_id) DO UPDATE
           SET partner_account_id = EXCLUDED.partner_account_id,
               elite_application_id = EXCLUDED.elite_application_id,
               referral_code_used = EXCLUDED.referral_code_used,
               status = 'PENDING',
               updated_at = NOW()`,
          [partnerAccountId, userId, applicationId, normalizedReferralCode],
        );
      }

      await client.query("COMMIT");
      return { applicationId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getEliteStatus(userId: number) {
    const memberRes = await pool.query(
      `SELECT em.id AS "memberId",
              em.status AS "memberStatus",
              em.current_capital_amount AS "currentCapitalAmount",
              ea.id AS "applicationId",
              ea.status AS "applicationStatus",
              ea.phone_number AS "phoneNumber",
              ea.investment_amount AS "investmentAmount",
              ea.description,
              ea.referral_code_used AS "referralCodeUsed",
              ea.created_at AS "createdAt"
       FROM elite_members em
       LEFT JOIN elite_applications ea ON ea.id = em.application_id
       WHERE em.user_id = $1
       ORDER BY em.created_at DESC, em.id DESC
       LIMIT 1`,
      [userId],
    );

    if (memberRes.rows[0]) {
      const row = memberRes.rows[0];
      const memberStatus = String(row.memberStatus || "").toUpperCase();
      const derivedStatus =
        row.applicationStatus ??
        (memberStatus === "ACTIVE" ? "APPROVED" : memberStatus || "NONE");

      return {
        status: derivedStatus,
        applicationId: row.applicationId ? Number(row.applicationId) : null,
        phoneNumber: row.phoneNumber ?? null,
        investmentAmount: toNumber(row.investmentAmount),
        description: row.description ?? null,
        memberId: Number(row.memberId),
        memberStatus: row.memberStatus ?? null,
        currentCapitalAmount: toNumber(row.currentCapitalAmount, 0),
        referralCodeUsed: row.referralCodeUsed ?? null,
        createdAt: row.createdAt ?? null,
        sourceType: row.applicationId ? "APPLICATION" : "MANUAL",
      };
    }

    const appRes = await pool.query(
      `SELECT ea.id,
              ea.status,
              ea.phone_number AS "phoneNumber",
              ea.investment_amount AS "investmentAmount",
              ea.description,
              ea.referral_code_used AS "referralCodeUsed",
              ea.created_at AS "createdAt"
       FROM elite_applications ea
       WHERE ea.user_id = $1
       ORDER BY ea.created_at DESC, ea.id DESC
       LIMIT 1`,
      [userId],
    );

    if (!appRes.rows[0]) {
      return { status: "NONE" as const };
    }

    const row = appRes.rows[0];
    return {
      status: row.status,
      applicationId: Number(row.id),
      phoneNumber: row.phoneNumber,
      investmentAmount: toNumber(row.investmentAmount),
      description: row.description,
      memberId: null,
      memberStatus: null,
      currentCapitalAmount: 0,
      referralCodeUsed: row.referralCodeUsed ?? null,
      createdAt: row.createdAt,
      sourceType: "APPLICATION",
    };
  }

  async getPartnerDashboard(userId: number) {
    const partner = await this.getPartnerAccountByUserId(userId);
    if (!partner) {
      return { status: "NONE" };
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";

    const summaryRes = await pool.query(
      `SELECT
  COUNT(DISTINCT pil.investor_user_id) AS clients_count,
  COALESCE((
    SELECT SUM(eps2.current_capital_amount)
    FROM partner_investor_links pil2
    JOIN elite_members em2 ON em2.user_id = pil2.investor_user_id
    JOIN elite_portfolios_simple eps2 ON eps2.elite_member_id = em2.id
    WHERE pil2.partner_account_id = pa.id
      AND pil2.status IN ('PENDING', 'ACTIVE')
  ), 0) AS total_capital,
  COALESCE(SUM(pcs.realized_profit_amount), 0) AS total_realized_profit,
  COALESCE(SUM(pcs.partner_profit_share_amount), 0) AS partner_share
FROM partner_accounts pa
LEFT JOIN partner_investor_links pil
  ON pil.partner_account_id = pa.id
 AND pil.status IN ('PENDING', 'ACTIVE')
LEFT JOIN elite_members em
  ON em.user_id = pil.investor_user_id
LEFT JOIN elite_portfolios_simple eps
  ON eps.elite_member_id = em.id
LEFT JOIN portfolio_positions_simple pps
  ON pps.portfolio_id = eps.id
LEFT JOIN position_closures_simple pcs
  ON pcs.position_id = pps.id
WHERE pa.id = $1
GROUP BY pa.id`,
      [partner.id],
    );

    const summary = summaryRes.rows[0] || {};
    const payout = await this.getPartnerPayoutSummary(Number(partner.id));
    const portfolioIds = Array.isArray(summary.portfolio_ids)
      ? summary.portfolio_ids
          .map((value: unknown) => toNumber(value))
          .filter((value: number) => value > 0)
      : [];
    let totalPartnerShare = 0;
    for (const portfolioId of portfolioIds) {
      totalPartnerShare +=
        await this.getCurrentPartnerShareDueByPortfolioId(portfolioId);
    }

    return {
      status: partner.status,
      partner,
      referralCode: partner.referralCode,
      invitationLink: partner.referralCode
        ? `${baseUrl}/en/elite-group?ref=${partner.referralCode}`
        : null,
      clientsCount: toNumber(summary.clients_count, 0),
      totalCapital: toNumber(summary.total_capital, 0),
      totalRealizedProfit: toNumber(summary.total_realized_profit, 0),
      totalPartnerShare: Math.round(totalPartnerShare * 100) / 100,
      partnerUnlockedAmount: payout.summary.unlockedAmount,
      partnerAvailableToRequestAmount: payout.summary.availableToRequestAmount,
      partnerRequestedLockedAmount: payout.summary.requestedLockedAmount,
      partnerPaidOutAmount: payout.summary.paidOutAmount,
      iban: partner.iban ?? null,
      payoutRequests: payout.requests,
    };
  }

  async getPartnerClients(userId: number) {
    const partner = await this.getPartnerAccountByUserId(userId);
    if (!partner) return [];

    const { rows } = await pool.query(
      `SELECT pil.investor_user_id AS "investorUserId",
          COALESCE(${displayNameSql}, u.email) AS "investorName",
          u.email,
          pil.status AS "linkStatus",
          em.id AS "memberId",
          eps.id AS "portfolioId",
          em.status AS "memberStatus",
          COALESCE(eps.current_capital_amount, em.current_capital_amount, 0) AS "currentCapital",
          COALESCE(SUM(pcs.realized_profit_amount), 0) AS "realizedProfit",
          COALESCE(SUM(pcs.partner_profit_share_amount), 0) AS "partnerShare",
          COALESCE(SUM(alloc.amount_applied), 0) AS "firmProfitPaid",
          COALESCE(SUM(
            CASE
              WHEN pcs.firm_profit_share_amount > 0 THEN pcs.partner_profit_share_amount * LEAST(COALESCE(alloc.amount_applied, 0) / pcs.firm_profit_share_amount, 1)
              ELSE 0
            END
          ), 0) AS "partnerUnlockedAmount",
          COUNT(DISTINCT CASE
            WHEN pps.status IN ('OPEN','PARTIALLY_CLOSED','PENDING_CLOSE') THEN pps.id
          END) AS "openPositions",
          MAX(pil.created_at) AS "sortCreatedAt"
   FROM partner_investor_links pil
   JOIN users u ON u.id = pil.investor_user_id
   LEFT JOIN elite_members em ON em.user_id = pil.investor_user_id
   LEFT JOIN elite_portfolios_simple eps ON eps.elite_member_id = em.id
   LEFT JOIN portfolio_positions_simple pps ON pps.portfolio_id = eps.id
   LEFT JOIN position_closures_simple pcs ON pcs.position_id = pps.id
   LEFT JOIN (
     SELECT fppa.closure_id,
            SUM(fppa.amount_applied) AS amount_applied
     FROM firm_profit_payment_allocations fppa
     JOIN firm_profit_payments fpp ON fpp.id = fppa.payment_id
     WHERE fpp.status = 'PAID'
     GROUP BY fppa.closure_id
   ) alloc ON alloc.closure_id = pcs.id
   WHERE pil.partner_account_id = $1
   GROUP BY pil.investor_user_id, u.id, em.id, eps.id, pil.status
   ORDER BY "sortCreatedAt" DESC`,
      [partner.id],
    );

    return Promise.all(
      rows.map(async (row) => ({
        investorUserId: Number(row.investorUserId),
        investorName: row.investorName,
        email: row.email,
        linkStatus: row.linkStatus,
        memberId: row.memberId ? Number(row.memberId) : null,
        portfolioId: row.portfolioId ? Number(row.portfolioId) : null,
        memberStatus: row.memberStatus ?? null,
        currentCapital: toNumber(row.currentCapital),
        realizedProfit: toNumber(row.realizedProfit),
        partnerShare: await this.getCurrentPartnerShareDueByPortfolioId(
          row.portfolioId ? Number(row.portfolioId) : null,
        ),
        firmProfitPaid: toNumber(row.firmProfitPaid),
        partnerUnlockedAmount: toNumber(row.partnerUnlockedAmount),
        openPositions: toNumber(row.openPositions),
      })),
    );
  }

  async getPartnerClientDetail(userId: number, investorUserId: number) {
    const partner = await this.getPartnerAccountByUserId(userId);
    if (!partner) {
      throw new Error("Partner account not found");
    }

    const detailRes = await pool.query(
      `SELECT pil.id,
              pil.status AS "linkStatus",
              pil.referral_code_used AS "referralCodeUsed",
              COALESCE(${displayNameSql}, u.email) AS "investorName",
              u.email,
              em.id AS "memberId",
              COALESCE(eps.current_capital_amount, em.current_capital_amount, 0) AS "currentCapital"
       FROM partner_investor_links pil
       JOIN users u ON u.id = pil.investor_user_id
       LEFT JOIN elite_members em ON em.user_id = pil.investor_user_id
       LEFT JOIN elite_portfolios_simple eps ON eps.elite_member_id = em.id
       WHERE pil.partner_account_id = $1
         AND pil.investor_user_id = $2
       LIMIT 1`,
      [partner.id, investorUserId],
    );

    const detail = detailRes.rows[0];
    if (!detail) {
      throw new Error("Investor not linked to this partner");
    }

    const memberId = detail.memberId ? Number(detail.memberId) : null;
    let positions: any[] = [];
    let closures: any[] = [];
    let firmProfitPaid = 0;
    let partnerUnlockedAmount = 0;
    let portfolioId = 0;

    if (memberId) {
      const portfolioRes = await pool.query(
        `SELECT id FROM elite_portfolios_simple WHERE elite_member_id = $1 LIMIT 1`,
        [memberId],
      );
      portfolioId = Number(portfolioRes.rows[0]?.id || 0);
      if (portfolioId) {
        const positionRes = await pool.query(
          `SELECT id, symbol, quantity_open AS quantity, entry_price AS "entryPrice", opened_at AS "openedAt", status
           FROM portfolio_positions_simple
           WHERE portfolio_id = $1
             AND status IN ('OPEN', 'PARTIALLY_CLOSED', 'PENDING_CLOSE')
           ORDER BY opened_at DESC`,
          [portfolioId],
        );
        positions = positionRes.rows.map((row) => ({
          id: Number(row.id),
          symbol: row.symbol,
          quantity: toNumber(row.quantity),
          entryPrice: toNumber(row.entryPrice),
          openedAt: row.openedAt,
          status: row.status,
        }));

        const closureRes = await pool.query(
          `SELECT pcs.id,
                  pps.symbol,
                  pcs.closed_quantity AS quantity,
                  pcs.exit_price AS "exitPrice",
                  pcs.realized_profit_amount AS "realizedProfit",
                  pcs.firm_profit_share_amount AS "firmShare",
                  pcs.partner_profit_share_amount AS "partnerShare",
                  COALESCE(alloc.amount_applied, 0) AS "firmPaidAmount",
                  pcs.closed_at AS "closedAt"
           FROM position_closures_simple pcs
           JOIN portfolio_positions_simple pps ON pps.id = pcs.position_id
           LEFT JOIN (
             SELECT fppa.closure_id,
                    SUM(fppa.amount_applied) AS amount_applied
             FROM firm_profit_payment_allocations fppa
             JOIN firm_profit_payments fpp ON fpp.id = fppa.payment_id
             WHERE fpp.status = 'PAID'
             GROUP BY fppa.closure_id
           ) alloc ON alloc.closure_id = pcs.id
           WHERE pps.portfolio_id = $1
           ORDER BY pcs.closed_at DESC`,
          [portfolioId],
        );
        closures = closureRes.rows.map((row) => {
          const firmShare = toNumber(row.firmShare);
          const partnerShare = toNumber(row.partnerShare);
          const paidAmount = Math.min(firmShare, toNumber(row.firmPaidAmount));
          const paidRatio =
            firmShare > 0 ? Math.min(1, paidAmount / firmShare) : 0;

          firmProfitPaid += paidAmount;
          partnerUnlockedAmount += partnerShare * paidRatio;

          return {
            id: Number(row.id),
            symbol: row.symbol,
            quantity: toNumber(row.quantity),
            exitPrice: toNumber(row.exitPrice),
            realizedProfit: toNumber(row.realizedProfit),
            firmShare,
            firmPaidAmount: paidAmount,
            partnerShare,
            partnerUnlockedAmount: partnerShare * paidRatio,
            closedAt: row.closedAt,
          };
        });
      }
    }

    return {
      investorUserId,
      investorName: detail.investorName,
      email: detail.email,
      linkStatus: detail.linkStatus,
      referralCodeUsed: detail.referralCodeUsed,
      currentCapital: toNumber(detail.currentCapital),
      positions,
      closures,
      summary: {
        realizedProfit: closures.reduce(
          (sum, item) => sum + item.realizedProfit,
          0,
        ),
        partnerShare: portfolioId
          ? await this.getCurrentPartnerShareDueByPortfolioId(portfolioId)
          : 0,
        firmProfitPaid,
        partnerUnlockedAmount,
      },
    };
  }

  async listAdminPartners() {
    const { rows } = await pool.query(
      `SELECT pa.id,
              pa.user_id AS "userId",
              pa.status,
              pa.display_name AS "displayName",
              pa.phone_number AS "phoneNumber",
              pa.bio,
              pa.referral_code AS "referralCode",
              pa.created_at AS "createdAt",
              COALESCE(${displayNameSql}, u.email) AS "ownerName",
              u.email,
              COUNT(DISTINCT pil.investor_user_id) AS "investorsCount"
       FROM partner_accounts pa
       JOIN users u ON u.id = pa.user_id
       LEFT JOIN partner_investor_links pil ON pil.partner_account_id = pa.id
       GROUP BY pa.id, u.id
       ORDER BY pa.created_at DESC`,
      [],
    );

    return Promise.all(
      rows.map(async (row) => {
        const clients = await this.getPartnerClients(Number(row.userId));
        return {
          id: Number(row.id),
          status: row.status,
          displayName: row.displayName,
          phoneNumber: row.phoneNumber,
          bio: row.bio,
          referralCode: row.referralCode,
          createdAt: row.createdAt,
          ownerName: row.ownerName,
          email: row.email,
          investorsCount: toNumber(row.investorsCount),
          partnerShare:
            Math.round(
              clients.reduce(
                (sum, item) => sum + toNumber(item.partnerShare),
                0,
              ) * 100,
            ) / 100,
        };
      }),
    );
  }

  async getAdminPartnerDetail(partnerId: number) {
    const partnerRes = await pool.query(
      `SELECT pa.id,
              pa.user_id AS "userId",
              pa.status,
              pa.display_name AS "displayName",
              pa.phone_number AS "phoneNumber",
              pa.bio,
              pa.referral_code AS "referralCode",
              pa.iban,
              pa.review_note AS "reviewNote",
              pa.created_at AS "createdAt",
              pa.approved_at AS "approvedAt",
              COALESCE(${displayNameSql}, u.email) AS "ownerName",
              u.email
       FROM partner_accounts pa
       JOIN users u ON u.id = pa.user_id
       WHERE pa.id = $1
       LIMIT 1`,
      [partnerId],
    );

    const partner = partnerRes.rows[0];
    if (!partner) throw new Error("Partner not found");

    const investors = await this.getPartnerClients(Number(partner.userId));
    const payout = await this.getPartnerPayoutSummary(partnerId);

    return {
      ...partner,
      investors,
      iban: partner.iban ?? null,
      payoutSummary: payout.summary,
      payoutRequests: payout.requests,
    };
  }

  async reviewPartner(
    partnerId: number,
    adminUserId: number,
    approve: boolean,
    reviewNote?: string | null,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const partnerRes = await client.query(
        `SELECT id, referral_code
       FROM partner_accounts
       WHERE id = $1
       FOR UPDATE`,
        [partnerId],
      );

      const partner = partnerRes.rows[0];
      if (!partner) throw new Error("Partner not found");

      const status = approve ? "APPROVED" : "REJECTED";
      let referralCode = partner.referral_code as string | null;

      if (approve && !referralCode) {
        referralCode = randomReferralCode(partnerId);
      }

      await client.query(
        `UPDATE partner_accounts
       SET status = $2::varchar,
           referral_code = $3,
           reviewed_by = $4,
           reviewed_at = NOW(),
           approved_at = CASE WHEN $6 THEN NOW() ELSE approved_at END,
           review_note = $5,
           updated_at = NOW()
       WHERE id = $1`,
        [
          partnerId,
          status,
          referralCode,
          adminUserId,
          reviewNote?.trim() || null,
          approve,
        ],
      );

      if (!approve) {
        await client.query(
          `UPDATE partner_investor_links
         SET status = 'REJECTED',
             updated_at = NOW()
         WHERE partner_account_id = $1
           AND status = 'PENDING'`,
          [partnerId],
        );
      }

      await client.query("COMMIT");
      return { status, referralCode };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listAdminInvestors() {
    const { rows } = await pool.query(
      `SELECT ea.id AS "applicationId",
            'APPLICATION' AS "sourceType",
            ea.status AS "applicationStatus",
            ea.phone_number AS "phoneNumber",
            ea.investment_amount AS "investmentAmount",
            ea.created_at AS "appliedAt",
            em.id AS "memberId",
            em.status AS "memberStatus",
            COALESCE(eps.current_capital_amount, em.current_capital_amount, 0) AS "currentCapital",
            COALESCE(${displayNameSql}, u.email) AS "investorName",
            u.email,
            pa.id AS "partnerId",
            pa.display_name AS "partnerName"
     FROM elite_applications ea
     JOIN users u ON u.id = ea.user_id
     LEFT JOIN elite_members em ON em.application_id = ea.id
     LEFT JOIN elite_portfolios_simple eps ON eps.elite_member_id = em.id
     LEFT JOIN partner_accounts pa ON pa.id = ea.partner_account_id

     UNION ALL

     SELECT NULL::integer AS "applicationId",
            'MANUAL' AS "sourceType",
            'MANUAL'::varchar AS "applicationStatus",
            COALESCE(u.phonenumber, '') AS "phoneNumber",
            0::numeric AS "investmentAmount",
            em.created_at AS "appliedAt",
            em.id AS "memberId",
            em.status AS "memberStatus",
            COALESCE(eps.current_capital_amount, em.current_capital_amount, 0) AS "currentCapital",
            COALESCE(${displayNameSql}, u.email) AS "investorName",
            u.email,
            pa.id AS "partnerId",
            pa.display_name AS "partnerName"
     FROM elite_members em
     JOIN users u ON u.id = em.user_id
     LEFT JOIN elite_portfolios_simple eps ON eps.elite_member_id = em.id
     LEFT JOIN partner_investor_links pil
       ON pil.investor_user_id = em.user_id
      AND pil.status IN ('ACTIVE', 'PENDING')
     LEFT JOIN partner_accounts pa
       ON pa.id = pil.partner_account_id
     WHERE em.application_id IS NULL

     ORDER BY "appliedAt" DESC`,
      [],
    );

    return rows.map((row) => ({
      applicationId: row.applicationId ? Number(row.applicationId) : null,
      sourceType: row.sourceType,
      applicationStatus: row.applicationStatus,
      phoneNumber: row.phoneNumber,
      investmentAmount: toNumber(row.investmentAmount),
      appliedAt: row.appliedAt,
      memberId: row.memberId ? Number(row.memberId) : null,
      memberStatus: row.memberStatus ?? null,
      currentCapital: toNumber(row.currentCapital),
      investorName: row.investorName,
      email: row.email,
      partnerId: row.partnerId ? Number(row.partnerId) : null,
      partnerName: row.partnerName ?? null,
    }));
  }
  async reviewInvestorApplication(
    applicationId: number,
    adminUserId: number,
    approve: boolean,
    adminNote?: string | null,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const appRes = await client.query(
        `SELECT id, user_id, investment_amount, partner_account_id
         FROM elite_applications
         WHERE id = $1
         FOR UPDATE`,
        [applicationId],
      );
      const app = appRes.rows[0];
      if (!app) throw new Error("Application not found");

      const applicationStatus = approve ? "APPROVED" : "REJECTED";

      await client.query(
        `UPDATE elite_applications
         SET status = $2,
             admin_note = $3,
             reviewed_by = $4,
             reviewed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [
          applicationId,
          applicationStatus,
          adminNote?.trim() || null,
          adminUserId,
        ],
      );

      let memberId: number | null = null;
      if (approve) {
        const memberRes = await client.query(
          `INSERT INTO elite_members (
             user_id,
             application_id,
             approved_at,
             is_active,
             created_at,
             approved_by,
             current_capital_amount,
             capital_updated_at,
             status
           ) VALUES ($1, $2, NOW(), true, NOW(), $3, $4, NOW(), 'ACTIVE')
           ON CONFLICT (user_id) DO UPDATE
           SET application_id = EXCLUDED.application_id,
               approved_at = NOW(),
               is_active = true,
               approved_by = EXCLUDED.approved_by,
               current_capital_amount = EXCLUDED.current_capital_amount,
               capital_updated_at = NOW(),
               status = 'ACTIVE'
           RETURNING id`,
          [
            app.user_id,
            applicationId,
            adminUserId,
            toNumber(app.investment_amount),
          ],
        );
        memberId = Number(memberRes.rows[0].id);

        await client.query(
          `INSERT INTO elite_portfolios_simple (
             elite_member_id,
             current_capital_amount,
             currency,
             status,
             created_at,
             updated_at
           ) VALUES ($1, $2, 'USD', 'ACTIVE', NOW(), NOW())
           ON CONFLICT (elite_member_id) DO UPDATE
           SET current_capital_amount = EXCLUDED.current_capital_amount,
               status = 'ACTIVE',
               updated_at = NOW()`,
          [memberId, toNumber(app.investment_amount)],
        );

        if (app.partner_account_id) {
          await client.query(
            `INSERT INTO partner_investor_links (
               partner_account_id,
               investor_user_id,
               elite_application_id,
               elite_member_id,
               referral_code_used,
               status,
               linked_at,
               activated_at,
               created_at,
               updated_at
             )
             SELECT $1, $2, $3, $4, ea.referral_code_used, 'ACTIVE', NOW(), NOW(), NOW(), NOW()
             FROM elite_applications ea
             WHERE ea.id = $3
             ON CONFLICT (investor_user_id) DO UPDATE
             SET partner_account_id = EXCLUDED.partner_account_id,
                 elite_application_id = EXCLUDED.elite_application_id,
                 elite_member_id = EXCLUDED.elite_member_id,
                 referral_code_used = EXCLUDED.referral_code_used,
                 status = 'ACTIVE',
                 activated_at = NOW(),
                 updated_at = NOW()`,
            [app.partner_account_id, app.user_id, applicationId, memberId],
          );
        }
      } else {
        await client.query(
          `UPDATE partner_investor_links
           SET status = 'REJECTED', updated_at = NOW()
           WHERE investor_user_id = $1`,
          [app.user_id],
        );
      }

      await client.query("COMMIT");
      return { applicationStatus, memberId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getInvestorContext(userId: number) {
    const { rows } = await pool.query(
      `SELECT em.id AS "memberId",
              em.user_id AS "userId",
              em.status AS "memberStatus",
              em.current_capital_amount AS "currentCapitalAmount",
              eps.id AS "portfolioId",
              eps.current_capital_amount AS "portfolioCapital",
              ea.id AS "applicationId",
              ea.status AS "applicationStatus"
       FROM elite_members em
       LEFT JOIN elite_portfolios_simple eps ON eps.elite_member_id = em.id
       LEFT JOIN elite_applications ea ON ea.id = em.application_id
       WHERE em.user_id = $1
         AND em.status = 'ACTIVE'
       LIMIT 1`,
      [userId],
    );

    if (!rows[0]) {
      throw new Error("Investor is not an active elite member");
    }

    return {
      memberId: Number(rows[0].memberId),
      userId,
      memberStatus: rows[0].memberStatus,
      portfolioId: Number(rows[0].portfolioId),
      currentCapitalAmount: toNumber(
        rows[0].portfolioCapital || rows[0].currentCapitalAmount,
      ),
      applicationId: rows[0].applicationId
        ? Number(rows[0].applicationId)
        : null,
      applicationStatus: rows[0].applicationStatus ?? null,
    };
  }

  private async getUserEmail(userId: number) {
    const res = await pool.query(
      `SELECT email FROM users WHERE id = $1 LIMIT 1`,
      [userId],
    );
    return (res.rows[0]?.email as string | undefined) ?? null;
  }

  private getAppBaseUrl(origin?: string | null) {
    return (
      origin ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      ""
    ).replace(/\/$/, "");
  }

  private sanitizeReturnPath(returnPath?: string | null) {
    const path = String(returnPath || "").trim();
    if (!path.startsWith("/") || path.startsWith("//")) {
      return "/en/elite-group/portfolio";
    }
    return path;
  }

  private async getFirmPaymentSummaryByPortfolioId(portfolioId: number) {
    const roundMoney = (value: number) => Math.round(value * 100) / 100;

    const closureRes = await pool.query(
      `SELECT pcs.id,
              pcs.closed_at AS "closedAt",
              pcs.realized_profit_amount AS "realizedProfitAmount",
              pcs.firm_profit_share_amount AS "firmShareAmount",
              pcs.partner_profit_share_amount AS "partnerShareAmount"
       FROM position_closures_simple pcs
       JOIN portfolio_positions_simple pps ON pps.id = pcs.position_id
       WHERE pps.portfolio_id = $1`,
      [portfolioId],
    );

    const allocationRes = await pool.query(
      `SELECT fppa.closure_id AS "closureId",
              COALESCE(SUM(fppa.amount_applied), 0) AS "amountApplied"
       FROM firm_profit_payment_allocations fppa
       JOIN firm_profit_payments fpp ON fpp.id = fppa.payment_id
       JOIN position_closures_simple pcs ON pcs.id = fppa.closure_id
       JOIN portfolio_positions_simple pps ON pps.id = pcs.position_id
       WHERE pps.portfolio_id = $1
         AND fpp.status = 'PAID'
       GROUP BY fppa.closure_id`,
      [portfolioId],
    );

    const paymentHistoryRes = await pool.query(
      `SELECT fpp.id,
              fpp.amount_requested AS "amountRequested",
              fpp.amount_paid AS "amountPaid",
              fpp.currency,
              fpp.status,
              COALESCE(fpp.payment_method, 'STRIPE') AS "paymentMethod",
              fpp.bank_account_id AS "bankAccountId",
              fpp.manual_reference AS "manualReference",
              fpp.transfer_reference AS "transferReference",
              fpp.proof_url AS "proofUrl",
              fpp.proof_name AS "proofName",
              fpp.submitted_at AS "submittedAt",
              fpp.reviewed_by AS "reviewedBy",
              fpp.reviewed_at AS "reviewedAt",
              fpp.review_note AS "reviewNote",
              fpp.stripe_checkout_session_id AS "stripeCheckoutSessionId",
              fpp.stripe_payment_intent_id AS "stripePaymentIntentId",
              fpp.checkout_url AS "checkoutUrl",
              fpp.checkout_expires_at AS "checkoutExpiresAt",
              fpp.paid_at AS "paidAt",
              fpp.created_at AS "createdAt",
              fba.account_name AS "bankAccountName",
              fba.bank_name AS "bankName",
              fba.iban,
              fba.swift_code AS "swiftCode"
       FROM firm_profit_payments fpp
       LEFT JOIN firm_bank_accounts fba ON fba.id = fpp.bank_account_id
       WHERE fpp.portfolio_id = $1
       ORDER BY fpp.created_at DESC`,
      [portfolioId],
    );

    const paymentHistory = paymentHistoryRes.rows.map((row) => ({
      id: Number(row.id),
      amountRequested: toNumber(row.amountRequested),
      amountPaid: toNumber(row.amountPaid),
      currency: row.currency,
      status: row.status,
      paymentMethod: row.paymentMethod ?? "STRIPE",
      bankAccountId: row.bankAccountId ? Number(row.bankAccountId) : null,
      manualReference: row.manualReference ?? null,
      transferReference: row.transferReference ?? null,
      proofUrl: row.proofUrl ?? null,
      proofName: row.proofName ?? null,
      submittedAt: row.submittedAt ?? null,
      reviewedBy: row.reviewedBy ? Number(row.reviewedBy) : null,
      reviewedAt: row.reviewedAt ?? null,
      reviewNote: row.reviewNote ?? null,
      stripeCheckoutSessionId: row.stripeCheckoutSessionId ?? null,
      stripePaymentIntentId: row.stripePaymentIntentId ?? null,
      checkoutUrl: row.checkoutUrl ?? null,
      checkoutExpiresAt: row.checkoutExpiresAt ?? null,
      paidAt: row.paidAt ?? null,
      createdAt: row.createdAt,
      bankAccountName: row.bankAccountName ?? null,
      bankName: row.bankName ?? null,
      iban: row.iban ?? null,
      swiftCode: row.swiftCode ?? null,
    }));

    const allocationByClosure = new Map<number, number>();
    for (const row of allocationRes.rows) {
      allocationByClosure.set(
        Number(row.closureId),
        toNumber(row.amountApplied),
      );
    }

    const closures = closureRes.rows.map((row) => {
      const firmShareAmount = toNumber(row.firmShareAmount);
      const partnerShareAmount = toNumber(row.partnerShareAmount);
      const firmPaidAmount = Math.min(
        firmShareAmount,
        allocationByClosure.get(Number(row.id)) || 0,
      );
      const paidRatio =
        firmShareAmount > 0 ? Math.min(1, firmPaidAmount / firmShareAmount) : 0;

      return {
        closureId: Number(row.id),
        closedAt: row.closedAt,
        realizedProfitAmount: toNumber(row.realizedProfitAmount),
        firmShareAmount,
        firmPaidAmount,
        firmOutstandingAmount: Math.max(firmShareAmount - firmPaidAmount, 0),
        partnerShareAmount,
        partnerUnlockedAmount: partnerShareAmount * paidRatio,
        partnerOutstandingAmount: Math.max(
          partnerShareAmount - partnerShareAmount * paidRatio,
          0,
        ),
      };
    });

    const firmProfitPaid = paymentHistory
      .filter((row) => row.status === "PAID")
      .reduce((sum, row) => sum + row.amountPaid, 0);
    const firmProfitOutstanding = closures.reduce(
      (sum, row) => sum + row.firmOutstandingAmount,
      0,
    );
    const partnerShareUnlocked = closures.reduce(
      (sum, row) => sum + row.partnerUnlockedAmount,
      0,
    );
    const partnerShareTotal = closures.reduce(
      (sum, row) => sum + row.partnerShareAmount,
      0,
    );
    const currentPartnerProfitDue = closures.reduce(
      (sum, row) => sum + row.partnerOutstandingAmount,
      0,
    );
    const unpaidClosedProfit = closures
      .filter((row) => row.firmOutstandingAmount > 0)
      .reduce((sum, row) => sum + row.realizedProfitAmount, 0);
    const paidPayments = paymentHistory
      .filter((row) => row.status === "PAID" && row.paidAt)
      .sort(
        (a, b) =>
          new Date(String(a.paidAt)).getTime() -
          new Date(String(b.paidAt)).getTime(),
      );

    return {
      summary: {
        firmProfitDue: roundMoney(firmProfitOutstanding),
        firmProfitPaid: roundMoney(firmProfitPaid),
        firmProfitOutstanding: roundMoney(firmProfitOutstanding),
        partnerShareTotal: roundMoney(partnerShareTotal),
        partnerShareUnlocked: roundMoney(partnerShareUnlocked),
        currentPartnerProfitDue: roundMoney(currentPartnerProfitDue),
        unpaidClosedProfit: roundMoney(unpaidClosedProfit),
        lastPaidAt:
          paidPayments.length > 0
            ? paidPayments[paidPayments.length - 1].paidAt
            : null,
      },
      paymentHistory,
      closures,
    };
  }

  private async getPartnerPayoutSummary(partnerAccountId: number) {
    const unlockedRes = await pool.query(
      `SELECT COALESCE(SUM(
                CASE
                  WHEN pcs.firm_profit_share_amount > 0 THEN pcs.partner_profit_share_amount * LEAST(alloc.paid_amount / pcs.firm_profit_share_amount, 1)
                  ELSE 0
                END
              ), 0) AS "unlockedAmount",
              COALESCE(SUM(pcs.partner_profit_share_amount), 0) AS "totalPartnerShare"
       FROM position_closures_simple pcs
       LEFT JOIN (
         SELECT fppa.closure_id,
                SUM(fppa.amount_applied) AS paid_amount
         FROM firm_profit_payment_allocations fppa
         JOIN firm_profit_payments fpp ON fpp.id = fppa.payment_id
         WHERE fpp.status = 'PAID'
         GROUP BY fppa.closure_id
       ) alloc ON alloc.closure_id = pcs.id
       WHERE pcs.partner_account_id = $1`,
      [partnerAccountId],
    );

    const requestRes = await pool.query(
      `SELECT id,
              requested_amount AS "requestedAmount",
              iban_snapshot AS "ibanSnapshot",
              note,
              status,
              review_note AS "reviewNote",
              paid_at AS "paidAt",
              created_at AS "createdAt"
       FROM partner_payout_requests
       WHERE partner_account_id = $1
       ORDER BY created_at DESC`,
      [partnerAccountId],
    );

    const requests = requestRes.rows.map((row) => ({
      id: Number(row.id),
      requestedAmount: toNumber(row.requestedAmount),
      ibanSnapshot: row.ibanSnapshot,
      note: row.note ?? null,
      status: row.status,
      reviewNote: row.reviewNote ?? null,
      paidAt: row.paidAt ?? null,
      createdAt: row.createdAt,
    }));

    const requestedLockedAmount = requests
      .filter((item) => ["PENDING", "PROCESSING", "PAID"].includes(item.status))
      .reduce((sum, item) => sum + item.requestedAmount, 0);

    const paidOutAmount = requests
      .filter((item) => item.status === "PAID")
      .reduce((sum, item) => sum + item.requestedAmount, 0);

    const unlockedAmount = toNumber(unlockedRes.rows[0]?.unlockedAmount);
    const totalPartnerShare = toNumber(unlockedRes.rows[0]?.totalPartnerShare);

    return {
      summary: {
        totalPartnerShare,
        unlockedAmount,
        requestedLockedAmount,
        paidOutAmount,
        availableToRequestAmount: Math.max(
          unlockedAmount - requestedLockedAmount,
          0,
        ),
      },
      requests,
    };
  }

  private async getCurrentPartnerShareDueByPortfolioId(
    portfolioId: number | null,
  ) {
    if (!portfolioId) return 0;
    const paymentSummary =
      await this.getFirmPaymentSummaryByPortfolioId(portfolioId);
    return toNumber(paymentSummary.summary.currentPartnerProfitDue);
  }

  private async allocateFirmProfitPayment(client: any, paymentId: number) {
    const paymentRes = await client.query(
      `SELECT id,
              portfolio_id,
              amount_paid,
              status
       FROM firm_profit_payments
       WHERE id = $1
       FOR UPDATE`,
      [paymentId],
    );

    const payment = paymentRes.rows[0];
    if (!payment || payment.status !== "PAID") {
      return;
    }

    const existingAllocations = await client.query(
      `SELECT 1 FROM firm_profit_payment_allocations WHERE payment_id = $1 LIMIT 1`,
      [paymentId],
    );
    if (existingAllocations.rows[0]) {
      return;
    }

    const closureRes = await client.query(
      `SELECT pcs.id,
              pcs.firm_profit_share_amount AS "firmShareAmount",
              COALESCE(alloc.paid_amount, 0) AS "alreadyPaid"
       FROM position_closures_simple pcs
       JOIN portfolio_positions_simple pps ON pps.id = pcs.position_id
       LEFT JOIN (
         SELECT fppa.closure_id,
                SUM(fppa.amount_applied) AS paid_amount
         FROM firm_profit_payment_allocations fppa
         JOIN firm_profit_payments fpp ON fpp.id = fppa.payment_id
         WHERE fpp.status = 'PAID'
         GROUP BY fppa.closure_id
       ) alloc ON alloc.closure_id = pcs.id
       WHERE pps.portfolio_id = $1
       ORDER BY pcs.closed_at ASC, pcs.id ASC`,
      [Number(payment.portfolio_id)],
    );

    let remaining = toNumber(payment.amount_paid);

    for (const row of closureRes.rows) {
      if (remaining <= 0) break;

      const firmShareAmount = toNumber(row.firmShareAmount);
      const alreadyPaid = toNumber(row.alreadyPaid);
      const outstanding = Math.max(firmShareAmount - alreadyPaid, 0);
      if (outstanding <= 0) continue;

      const amountApplied = Math.min(outstanding, remaining);
      await client.query(
        `INSERT INTO firm_profit_payment_allocations (
           payment_id,
           closure_id,
           amount_applied,
           created_at
         ) VALUES ($1, $2, $3, NOW())`,
        [paymentId, Number(row.id), amountApplied],
      );
      remaining -= amountApplied;
    }
  }

  private async setFreeCapital(
    client: any,
    memberId: number,
    portfolioId: number,
    amount: number,
  ) {
    if (amount < 0) {
      throw new Error("Capital amount cannot be negative");
    }

    await client.query(
      `UPDATE elite_portfolios_simple
       SET current_capital_amount = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [portfolioId, amount],
    );

    await client.query(
      `UPDATE elite_members
       SET current_capital_amount = $2,
           capital_updated_at = NOW()
       WHERE id = $1`,
      [memberId, amount],
    );

    return amount;
  }

  private async adjustFreeCapital(
    client: any,
    memberId: number,
    portfolioId: number,
    delta: number,
  ) {
    const capitalRes = await client.query(
      `UPDATE elite_portfolios_simple
       SET current_capital_amount = current_capital_amount + $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING current_capital_amount`,
      [portfolioId, delta],
    );

    const nextAmount = toNumber(capitalRes.rows[0]?.current_capital_amount, 0);
    if (nextAmount < 0) {
      throw new Error("Free capital cannot become negative");
    }

    await client.query(
      `UPDATE elite_members
       SET current_capital_amount = $2,
           capital_updated_at = NOW()
       WHERE id = $1`,
      [memberId, nextAmount],
    );

    return nextAmount;
  }

  async updateCurrentCapital(userId: number, capitalAmount: number) {
    const amount = toNumber(capitalAmount);
    if (amount < 0) throw new Error("Capital amount cannot be negative");

    const context = await this.getInvestorContext(userId);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await this.setFreeCapital(
        client,
        context.memberId,
        context.portfolioId,
        amount,
      );
      await client.query("COMMIT");
      return { currentCapitalAmount: amount };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getInvestorDashboard(userId: number) {
    const context = await this.getInvestorContext(userId);
    const portfolio = await this.getInvestorPortfolio(userId);

    const linkRes = await pool.query(
      `SELECT pa.display_name AS "partnerName"
       FROM partner_investor_links pil
       JOIN partner_accounts pa ON pa.id = pil.partner_account_id
       WHERE pil.investor_user_id = $1
         AND pil.status = 'ACTIVE'
       LIMIT 1`,
      [userId],
    );

    const planCountRes = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status IN ('SENT', 'ACCEPTED_BY_INVESTOR')) AS pending_plans,
              COUNT(*) FILTER (WHERE status = 'EXECUTED') AS executed_plans
       FROM trade_plans
       WHERE portfolio_id = $1`,
      [context.portfolioId],
    );

    const positionCountRes = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status IN ('OPEN','PARTIALLY_CLOSED','PENDING_CLOSE')) AS open_positions,
              COUNT(*) FILTER (WHERE status = 'CLOSED') AS closed_positions
       FROM portfolio_positions_simple
       WHERE portfolio_id = $1`,
      [context.portfolioId],
    );

    return {
      memberId: context.memberId,
      currentCapitalAmount: portfolio.summary.freeCapitalAmount,
      freeCapitalAmount: portfolio.summary.freeCapitalAmount,
      moneyInMarket: portfolio.summary.moneyInMarket,
      totalEquity: portfolio.summary.totalEquity,
      overallProfit: portfolio.summary.overallProfit,
      firmProfit: portfolio.summary.firmProfit,
      investorProfit: portfolio.summary.investorProfit,
      feeNotice: "15% of realized profit is retained by the firm.",
      pendingPlans: toNumber(planCountRes.rows[0]?.pending_plans),
      executedPlans: toNumber(planCountRes.rows[0]?.executed_plans),
      openPositions: toNumber(positionCountRes.rows[0]?.open_positions),
      closedPositions: toNumber(positionCountRes.rows[0]?.closed_positions),
      linkedPartnerName: linkRes.rows[0]?.partnerName ?? null,
    };
  }

  async getInvestorPlans(userId: number) {
    const context = await this.getInvestorContext(userId);

    const planRes = await pool.query(
      `SELECT tp.*,
              te.id AS execution_id,
              te.executed_quantity,
              te.executed_price,
              te.executed_at,
              te.screenshot_url,
              te.screenshot_name,
              te.investor_note AS execution_note,
              te.status AS execution_status
       FROM trade_plans tp
       LEFT JOIN trade_executions te ON te.trade_plan_id = tp.id
       WHERE tp.portfolio_id = $1
       ORDER BY tp.created_at DESC`,
      [context.portfolioId],
    );

    const planIds = planRes.rows.map((row) => Number(row.id));
    const messagesByPlan: Record<number, any[]> = {};
    if (planIds.length > 0) {
      const msgRes = await pool.query(
        `SELECT id,
                trade_plan_id AS "tradePlanId",
                sender_role AS "senderRole",
                message_text AS "messageText",
                created_at AS "createdAt"
         FROM trade_plan_messages
         WHERE trade_plan_id = ANY($1::int[])
         ORDER BY created_at ASC`,
        [planIds],
      );
      for (const row of msgRes.rows) {
        const key = Number(row.tradePlanId);
        messagesByPlan[key] ||= [];
        messagesByPlan[key].push({
          id: Number(row.id),
          senderRole: row.senderRole,
          messageText: row.messageText,
          createdAt: row.createdAt,
        });
      }
    }

    return planRes.rows.map((row) => ({
      id: Number(row.id),
      symbol: row.symbol,
      companyName: row.company_name,
      planSide: row.plan_side,
      referenceMarketPrice: toNumber(row.reference_market_price, 0),
      targetEntryPrice: toNumber(row.target_entry_price, 0),
      targetPrice1:
        row.target_price_1 == null ? null : toNumber(row.target_price_1),
      targetPrice2:
        row.target_price_2 == null ? null : toNumber(row.target_price_2),
      stopLossPrice:
        row.stop_loss_price == null ? null : toNumber(row.stop_loss_price),
      suggestedQuantity: toNumber(row.suggested_quantity),
      plannedAt: row.planned_at,
      adminNote: row.admin_note,
      investorDecision: row.investor_decision,
      investorNote: row.investor_note,
      status: row.status,
      execution:
        row.execution_id == null
          ? null
          : {
              id: Number(row.execution_id),
              executedQuantity: toNumber(row.executed_quantity),
              executedPrice: toNumber(row.executed_price),
              executedAt: row.executed_at,
              screenshotUrl: row.screenshot_url,
              screenshotName: row.screenshot_name,
              investorNote: row.execution_note,
              status: row.execution_status,
            },
      messages: messagesByPlan[Number(row.id)] || [],
    }));
  }

  async respondToTradePlan(
    userId: number,
    planId: number,
    decision: string,
    note?: string | null,
  ) {
    const normalizedDecision = normalizeDecision(decision);
    const context = await this.getInvestorContext(userId);

    const nextStatus =
      normalizedDecision === "ACCEPTED"
        ? "ACCEPTED_BY_INVESTOR"
        : "REJECTED_BY_INVESTOR";

    const trimmedNote = note?.trim() || null;

    const res = await pool.query(
      `UPDATE trade_plans
     SET investor_decision = $3::varchar,
         investor_note = $4,
         investor_responded_at = NOW(),
         status = $5::varchar,
         updated_at = NOW()
     WHERE id = $1
       AND portfolio_id = $2
       AND status IN ('SENT', 'ACCEPTED_BY_INVESTOR', 'REJECTED_BY_INVESTOR')
     RETURNING id`,
      [
        planId,
        context.portfolioId,
        normalizedDecision,
        trimmedNote,
        nextStatus,
      ],
    );

    if (!res.rows[0]) {
      throw new Error("Trade plan not found");
    }

    return { id: planId, decision: normalizedDecision };
  }
  async addInvestorPlanMessage(
    userId: number,
    planId: number,
    message: string,
  ) {
    const text = String(message || "").trim();
    if (!text) throw new Error("Message is required");
    const context = await this.getInvestorContext(userId);

    const ownership = await pool.query(
      `SELECT id FROM trade_plans WHERE id = $1 AND portfolio_id = $2 LIMIT 1`,
      [planId, context.portfolioId],
    );
    if (!ownership.rows[0]) throw new Error("Trade plan not found");

    await pool.query(
      `INSERT INTO trade_plan_messages (trade_plan_id, sender_user_id, sender_role, message_text, created_at)
       VALUES ($1, $2, 'INVESTOR', $3, NOW())`,
      [planId, userId, text],
    );

    return { success: true };
  }

  async submitTradeExecution(
    userId: number,
    planId: number,
    payload: {
      executedQuantity: number;
      executedPrice: number;
      executedAt: string;
      screenshotUrl?: string | null;
      screenshotName?: string | null;
      investorNote?: string | null;
    },
  ) {
    const context = await this.getInvestorContext(userId);
    const executedQuantity = toNumber(payload.executedQuantity);
    const executedPrice = toNumber(payload.executedPrice);
    const executedAt = payload.executedAt ? new Date(payload.executedAt) : null;

    if (
      executedQuantity <= 0 ||
      executedPrice <= 0 ||
      !executedAt ||
      Number.isNaN(executedAt.getTime())
    ) {
      throw new Error("Invalid execution data");
    }

    const grossCost = executedQuantity * executedPrice;
    if (grossCost <= 0) {
      throw new Error("Invalid execution amount");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const portfolioRes = await client.query(
        `SELECT current_capital_amount
         FROM elite_portfolios_simple
         WHERE id = $1
         FOR UPDATE`,
        [context.portfolioId],
      );
      const freeCapital = toNumber(
        portfolioRes.rows[0]?.current_capital_amount,
        context.currentCapitalAmount,
      );
      if (grossCost > freeCapital) {
        throw new Error("Not enough free capital for this execution");
      }

      const planRes = await client.query(
        `SELECT id, symbol, plan_side, status
         FROM trade_plans
         WHERE id = $1 AND portfolio_id = $2
         FOR UPDATE`,
        [planId, context.portfolioId],
      );
      const plan = planRes.rows[0];
      if (!plan) throw new Error("Trade plan not found");
      if (!["ACCEPTED_BY_INVESTOR", "EXECUTED"].includes(plan.status)) {
        throw new Error("Trade plan must be accepted first");
      }

      const existingExecution = await client.query(
        `SELECT id FROM trade_executions WHERE trade_plan_id = $1 LIMIT 1`,
        [planId],
      );
      if (existingExecution.rows[0]) {
        throw new Error("Execution already submitted");
      }

      const executionRes = await client.query(
        `INSERT INTO trade_executions (
           trade_plan_id,
           portfolio_id,
           executed_quantity,
           executed_price,
           executed_at,
           screenshot_url,
           screenshot_name,
           investor_note,
           status,
           created_at,
           updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPENED', NOW(), NOW())
         RETURNING id`,
        [
          planId,
          context.portfolioId,
          executedQuantity,
          executedPrice,
          executedAt.toISOString(),
          payload.screenshotUrl || null,
          payload.screenshotName || null,
          payload.investorNote?.trim() || null,
        ],
      );

      const executionId = Number(executionRes.rows[0].id);

      await client.query(
        `INSERT INTO portfolio_positions_simple (
           portfolio_id,
           trade_plan_id,
           trade_execution_id,
           symbol,
           side,
           quantity_open,
           entry_price,
           opened_at,
           status,
           created_at,
           updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', NOW(), NOW())`,
        [
          context.portfolioId,
          planId,
          executionId,
          plan.symbol,
          plan.plan_side,
          executedQuantity,
          executedPrice,
          executedAt.toISOString(),
        ],
      );

      const nextFreeCapital = await this.adjustFreeCapital(
        client,
        context.memberId,
        context.portfolioId,
        -grossCost,
      );

      await client.query(
        `UPDATE trade_plans
         SET status = 'EXECUTED', updated_at = NOW()
         WHERE id = $1`,
        [planId],
      );

      await client.query("COMMIT");
      return { executionId, currentCapitalAmount: nextFreeCapital };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getInvestorPortfolio(userId: number) {
    const context = await this.getInvestorContext(userId);

    const posRes = await pool.query(
      `SELECT pps.id,
              pps.symbol,
              pps.side,
              pps.quantity_open,
              pps.entry_price,
              pps.opened_at,
              pps.status,
              tp.target_price_1,
              tp.target_price_2,
              tp.stop_loss_price
       FROM portfolio_positions_simple pps
       LEFT JOIN trade_plans tp ON tp.id = pps.trade_plan_id
       WHERE pps.portfolio_id = $1
         AND pps.status IN ('OPEN', 'PARTIALLY_CLOSED', 'PENDING_CLOSE')
       ORDER BY pps.opened_at DESC`,
      [context.portfolioId],
    );

    const symbols = posRes.rows.map((row) => row.symbol);
    const quotes = await this.priceCache.getQuotes(symbols);

    const openPositions = posRes.rows.map((row) => {
      const quote = quotes[row.symbol];
      const currentPrice = quote?.price ?? toNumber(row.entry_price);
      const quantityOpen = toNumber(row.quantity_open);
      const entryPrice = toNumber(row.entry_price);
      const investedAmount = entryPrice * quantityOpen;
      const marketValue = currentPrice * quantityOpen;
      return {
        id: Number(row.id),
        symbol: row.symbol,
        side: row.side,
        quantityOpen,
        entryPrice,
        currentPrice,
        investedAmount,
        marketValue,
        unrealizedProfit: marketValue - investedAmount,
        openedAt: row.opened_at,
        status: row.status,
        targetPrice1:
          row.target_price_1 == null ? null : toNumber(row.target_price_1),
        targetPrice2:
          row.target_price_2 == null ? null : toNumber(row.target_price_2),
        stopLossPrice:
          row.stop_loss_price == null ? null : toNumber(row.stop_loss_price),
      };
    });

    const closeReqRes = await pool.query(
      `SELECT pcr.id,
              pcr.position_id AS "positionId",
              pcr.initiated_by_role AS "initiatedByRole",
              pcr.requested_quantity AS "requestedQuantity",
              pcr.requested_exit_price AS "requestedExitPrice",
              pcr.request_note AS "requestNote",
              pcr.evidence_url AS "evidenceUrl",
              pcr.evidence_name AS "evidenceName",
              pcr.status,
              pcr.response_note AS "responseNote",
              pcr.created_at AS "createdAt"
       FROM position_close_requests pcr
       JOIN portfolio_positions_simple pps ON pps.id = pcr.position_id
       WHERE pps.portfolio_id = $1
       ORDER BY pcr.created_at DESC`,
      [context.portfolioId],
    );

    const closeRequests = closeReqRes.rows.map((row) => ({
      id: Number(row.id),
      positionId: Number(row.positionId),
      initiatedByRole: row.initiatedByRole,
      requestedQuantity: toNumber(row.requestedQuantity),
      requestedExitPrice:
        row.requestedExitPrice == null
          ? null
          : toNumber(row.requestedExitPrice),
      requestNote: row.requestNote,
      evidenceUrl: row.evidenceUrl ?? null,
      evidenceName: row.evidenceName ?? null,
      status: row.status,
      responseNote: row.responseNote,
      createdAt: row.createdAt,
    }));

    const closureRes = await pool.query(
      `SELECT pcs.id,
              pps.symbol,
              pcs.closed_quantity AS "closedQuantity",
              pcs.exit_price AS "exitPrice",
              pcs.realized_profit_amount AS "realizedProfitAmount",
              pcs.firm_profit_share_amount AS "firmShareAmount",
              pcs.partner_profit_share_amount AS "partnerShareAmount",
              COALESCE(alloc.amount_applied, 0) AS "firmPaidAmount",
              pcs.evidence_url AS "evidenceUrl",
              pcs.evidence_name AS "evidenceName",
              pcs.closed_at AS "closedAt"
       FROM position_closures_simple pcs
       JOIN portfolio_positions_simple pps ON pps.id = pcs.position_id
       LEFT JOIN (
         SELECT fppa.closure_id,
                SUM(fppa.amount_applied) AS amount_applied
         FROM firm_profit_payment_allocations fppa
         JOIN firm_profit_payments fpp ON fpp.id = fppa.payment_id
         WHERE fpp.status = 'PAID'
         GROUP BY fppa.closure_id
       ) alloc ON alloc.closure_id = pcs.id
       WHERE pps.portfolio_id = $1
       ORDER BY pcs.closed_at DESC`,
      [context.portfolioId],
    );

    const closures = closureRes.rows.map((row) => {
      const firmShareAmount = toNumber(row.firmShareAmount);
      const partnerShareAmount = toNumber(row.partnerShareAmount);
      const firmPaidAmount = Math.min(
        firmShareAmount,
        toNumber(row.firmPaidAmount),
      );
      const paidRatio =
        firmShareAmount > 0 ? Math.min(1, firmPaidAmount / firmShareAmount) : 0;

      return {
        id: Number(row.id),
        symbol: row.symbol,
        closedQuantity: toNumber(row.closedQuantity),
        exitPrice: toNumber(row.exitPrice),
        realizedProfitAmount: toNumber(row.realizedProfitAmount),
        firmShareAmount,
        firmPaidAmount,
        firmOutstandingAmount: Math.max(firmShareAmount - firmPaidAmount, 0),
        partnerShareAmount,
        partnerUnlockedAmount: partnerShareAmount * paidRatio,
        evidenceUrl: row.evidenceUrl ?? null,
        evidenceName: row.evidenceName ?? null,
        closedAt: row.closedAt,
      };
    });

    const paymentSummary = await this.getFirmPaymentSummaryByPortfolioId(
      context.portfolioId,
    );

    const moneyInMarket = openPositions.reduce(
      (sum, item) => sum + item.marketValue,
      0,
    );
    const investedAtCost = openPositions.reduce(
      (sum, item) => sum + item.investedAmount,
      0,
    );
    const openUnrealizedProfit = openPositions.reduce(
      (sum, item) => sum + item.unrealizedProfit,
      0,
    );
    const realizedProfit = closures.reduce(
      (sum, item) => sum + item.realizedProfitAmount,
      0,
    );
    const firmProfit = paymentSummary.summary.firmProfitOutstanding;
    const partnerProfit = paymentSummary.summary.currentPartnerProfitDue;
    const settledFirmProfit = paymentSummary.summary.firmProfitPaid;
    const settledPartnerProfit = paymentSummary.summary.partnerShareUnlocked;
    const realizedInvestorProfit =
      realizedProfit -
      settledFirmProfit -
      settledPartnerProfit -
      firmProfit -
      partnerProfit;
    const overallProfit = realizedProfit + openUnrealizedProfit;
    const investorProfit =
      overallProfit -
      settledFirmProfit -
      settledPartnerProfit -
      firmProfit -
      partnerProfit;
    const freeCapitalAmount = context.currentCapitalAmount;
    const totalEquity = freeCapitalAmount + moneyInMarket;

    return {
      currentCapitalAmount: freeCapitalAmount,
      openPositions,
      closeRequests,
      closures,
      firmPayments: paymentSummary.paymentHistory,
      summary: {
        freeCapitalAmount,
        moneyInMarket,
        investedAtCost,
        totalEquity,
        openMarketValue: moneyInMarket,
        openUnrealizedProfit,
        realizedProfit,
        overallProfit,
        firmProfit,
        firmProfitPaid: paymentSummary.summary.firmProfitPaid,
        firmProfitOutstanding: paymentSummary.summary.firmProfitOutstanding,
        partnerProfit,
        partnerShareUnlocked: paymentSummary.summary.partnerShareUnlocked,
        realizedInvestorProfit,
        investorProfit,
      },
    };
  }

  private async ensurePositionBelongsToInvestor(
    userId: number,
    positionId: number,
  ) {
    const context = await this.getInvestorContext(userId);
    const res = await pool.query(
      `SELECT id, quantity_open, entry_price, portfolio_id
       FROM portfolio_positions_simple
       WHERE id = $1 AND portfolio_id = $2
       LIMIT 1`,
      [positionId, context.portfolioId],
    );
    if (!res.rows[0]) throw new Error("Position not found");
    return {
      portfolioId: context.portfolioId,
      positionId,
      quantityOpen: toNumber(res.rows[0].quantity_open),
      entryPrice: toNumber(res.rows[0].entry_price),
    };
  }

  async forceClosePositionByInvestor(
    userId: number,
    payload: {
      positionId: number;
      requestedQuantity?: number | null;
      requestedExitPrice?: number | null;
      requestNote?: string | null;
      evidenceUrl?: string | null;
      evidenceName?: string | null;
    },
  ) {
    const context = await this.getInvestorContext(userId);
    const evidenceUrl = payload.evidenceUrl?.trim() || null;
    const evidenceName = payload.evidenceName?.trim() || null;
    if (!evidenceUrl) {
      throw new Error("Closing evidence is required for investor force close");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const positionRes = await client.query(
        `SELECT pps.id,
                pps.quantity_open,
                pps.entry_price,
                pps.symbol,
                pps.portfolio_id,
                eps.elite_member_id AS member_id
         FROM portfolio_positions_simple pps
         JOIN elite_portfolios_simple eps ON eps.id = pps.portfolio_id
         WHERE pps.id = $1
           AND pps.portfolio_id = $2
           AND pps.status IN ('OPEN', 'PARTIALLY_CLOSED', 'PENDING_CLOSE')
         FOR UPDATE`,
        [Number(payload.positionId || 0), context.portfolioId],
      );

      const position = positionRes.rows[0];
      if (!position) throw new Error("Position not found");

      const requestedQuantity =
        payload.requestedQuantity == null
          ? toNumber(position.quantity_open)
          : toNumber(payload.requestedQuantity);
      if (
        requestedQuantity <= 0 ||
        requestedQuantity > toNumber(position.quantity_open)
      ) {
        throw new Error("Invalid close quantity");
      }

      const requestedExitPrice =
        payload.requestedExitPrice == null
          ? null
          : toNumber(payload.requestedExitPrice);
      if (requestedExitPrice != null && requestedExitPrice <= 0) {
        throw new Error("Invalid exit price");
      }

      const pendingRes = await client.query(
        `SELECT id FROM position_close_requests WHERE position_id = $1 AND status = 'PENDING' LIMIT 1`,
        [Number(position.id)],
      );
      if (pendingRes.rows[0]) {
        throw new Error(
          "There is already a pending close request for this position",
        );
      }

      const requestRes = await client.query(
        `INSERT INTO position_close_requests (
           position_id,
           initiated_by_user_id,
           initiated_by_role,
           requested_quantity,
           requested_exit_price,
           request_note,
           evidence_url,
           evidence_name,
           status,
           created_at,
           updated_at
         ) VALUES ($1, $2, 'INVESTOR', $3, $4, $5, $6, $7, 'PENDING', NOW(), NOW())
         RETURNING id`,
        [
          Number(position.id),
          userId,
          requestedQuantity,
          requestedExitPrice,
          payload.requestNote?.trim() || "Force closed by investor",
          evidenceUrl,
          evidenceName,
        ],
      );

      const requestId = Number(requestRes.rows[0].id);
      const result = await this.executeApprovedClose(
        client,
        requestId,
        userId,
        payload.requestNote?.trim() || "Force closed by investor",
      );

      await client.query("COMMIT");
      return { success: true, requestId, ...result };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async forceClosePositionByAdmin(
    adminUserId: number,
    positionId: number,
    payload: {
      requestedQuantity?: number | null;
      requestedExitPrice?: number | null;
      requestNote?: string | null;
    },
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const positionRes = await client.query(
        `SELECT pps.id,
                pps.quantity_open,
                pps.entry_price,
                pps.symbol,
                pps.portfolio_id,
                eps.elite_member_id AS member_id
         FROM portfolio_positions_simple pps
         JOIN elite_portfolios_simple eps ON eps.id = pps.portfolio_id
         WHERE pps.id = $1
           AND pps.status IN ('OPEN', 'PARTIALLY_CLOSED', 'PENDING_CLOSE')
         FOR UPDATE`,
        [positionId],
      );

      const position = positionRes.rows[0];
      if (!position) throw new Error("Position not found");

      const requestedQuantity =
        payload.requestedQuantity == null
          ? toNumber(position.quantity_open)
          : toNumber(payload.requestedQuantity);
      if (
        requestedQuantity <= 0 ||
        requestedQuantity > toNumber(position.quantity_open)
      ) {
        throw new Error("Invalid close quantity");
      }

      const requestedExitPrice =
        payload.requestedExitPrice == null
          ? null
          : toNumber(payload.requestedExitPrice);
      if (requestedExitPrice != null && requestedExitPrice <= 0) {
        throw new Error("Invalid exit price");
      }

      const pendingRes = await client.query(
        `SELECT id FROM position_close_requests WHERE position_id = $1 AND status = 'PENDING' LIMIT 1`,
        [Number(position.id)],
      );
      if (pendingRes.rows[0]) {
        throw new Error(
          "There is already a pending close request for this position",
        );
      }

      const requestRes = await client.query(
        `INSERT INTO position_close_requests (
           position_id,
           initiated_by_user_id,
           initiated_by_role,
           requested_quantity,
           requested_exit_price,
           request_note,
           status,
           created_at,
           updated_at
         ) VALUES ($1, $2, 'ADMIN', $3, $4, $5, 'PENDING', NOW(), NOW())
         RETURNING id`,
        [
          Number(position.id),
          adminUserId,
          requestedQuantity,
          requestedExitPrice,
          payload.requestNote?.trim() || "Force closed by admin",
        ],
      );

      const requestId = Number(requestRes.rows[0].id);
      const result = await this.executeApprovedClose(
        client,
        requestId,
        adminUserId,
        payload.requestNote?.trim() || "Force closed by admin",
      );

      await client.query("COMMIT");
      return { success: true, requestId, ...result };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async forceOpenTradePlanByAdmin(
    memberId: number,
    adminUserId: number,
    payload: {
      planId: number;
      executedQuantity?: number | null;
      executedPrice?: number | null;
      executedAt?: string | null;
      investorNote?: string | null;
    },
  ) {
    const planId = Number(payload.planId || 0);
    if (!memberId || !planId) {
      throw new Error("Invalid force open data");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const ctxRes = await client.query(
        `SELECT em.id AS member_id,
                eps.id AS portfolio_id,
                COALESCE(eps.current_capital_amount, em.current_capital_amount, 0) AS free_capital
         FROM elite_members em
         JOIN elite_portfolios_simple eps ON eps.elite_member_id = em.id
         WHERE em.id = $1
         FOR UPDATE OF em, eps`,
        [memberId],
      );
      const context = ctxRes.rows[0];
      if (!context) {
        throw new Error("Elite member portfolio not found");
      }

      const planRes = await client.query(
        `SELECT id,
                symbol,
                plan_side,
                status,
                suggested_quantity,
                target_entry_price,
                reference_market_price
         FROM trade_plans
         WHERE id = $1 AND portfolio_id = $2
         FOR UPDATE`,
        [planId, Number(context.portfolio_id)],
      );
      const plan = planRes.rows[0];
      if (!plan) throw new Error("Trade plan not found");
      if (
        ["EXECUTED", "CANCELLED", "CLOSED"].includes(
          String(plan.status || "").toUpperCase(),
        )
      ) {
        throw new Error(
          "Trade plan cannot be force opened from its current status",
        );
      }

      const existingExecution = await client.query(
        `SELECT id FROM trade_executions WHERE trade_plan_id = $1 LIMIT 1`,
        [planId],
      );
      if (existingExecution.rows[0]) {
        throw new Error("Execution already exists for this trade plan");
      }

      const executedQuantity =
        payload.executedQuantity == null
          ? toNumber(plan.suggested_quantity)
          : toNumber(payload.executedQuantity);
      const executedPrice =
        payload.executedPrice == null
          ? toNumber(plan.target_entry_price || plan.reference_market_price)
          : toNumber(payload.executedPrice);
      const executedAt = payload.executedAt
        ? new Date(payload.executedAt)
        : new Date();
      const normalizedExecutedAt = Number.isNaN(executedAt.getTime())
        ? new Date()
        : executedAt;

      if (executedQuantity <= 0 || executedPrice <= 0) {
        throw new Error("Invalid force open data");
      }

      const grossCost = executedQuantity * executedPrice;
      const freeCapital = toNumber(context.free_capital);
      if (grossCost > freeCapital) {
        throw new Error("Not enough free capital for this execution");
      }

      const executionRes = await client.query(
        `INSERT INTO trade_executions (
           trade_plan_id,
           portfolio_id,
           executed_quantity,
           executed_price,
           executed_at,
           investor_note,
           status,
           created_at,
           updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, 'OPENED', NOW(), NOW())
         RETURNING id`,
        [
          planId,
          Number(context.portfolio_id),
          executedQuantity,
          executedPrice,
          normalizedExecutedAt.toISOString(),
          payload.investorNote?.trim() || "Force opened by admin",
        ],
      );
      const executionId = Number(executionRes.rows[0].id);

      await client.query(
        `INSERT INTO portfolio_positions_simple (
           portfolio_id,
           trade_plan_id,
           trade_execution_id,
           symbol,
           side,
           quantity_open,
           entry_price,
           opened_at,
           status,
           created_at,
           updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'OPEN', NOW(), NOW())`,
        [
          Number(context.portfolio_id),
          planId,
          executionId,
          plan.symbol,
          plan.plan_side,
          executedQuantity,
          executedPrice,
          normalizedExecutedAt.toISOString(),
        ],
      );

      const nextFreeCapital = await this.adjustFreeCapital(
        client,
        Number(context.member_id),
        Number(context.portfolio_id),
        -grossCost,
      );

      await client.query(
        `UPDATE trade_plans
         SET status = 'EXECUTED',
             updated_at = NOW()
         WHERE id = $1`,
        [planId],
      );

      await client.query("COMMIT");
      return {
        success: true,
        executionId,
        currentCapitalAmount: nextFreeCapital,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async requestInvestorClose(
    userId: number,
    payload: {
      positionId: number;
      requestedQuantity: number;
      requestedExitPrice?: number | null;
      requestNote?: string | null;
      evidenceUrl?: string | null;
      evidenceName?: string | null;
    },
  ) {
    const position = await this.ensurePositionBelongsToInvestor(
      userId,
      Number(payload.positionId),
    );
    const quantity = toNumber(payload.requestedQuantity);
    const exitPrice =
      payload.requestedExitPrice == null
        ? null
        : toNumber(payload.requestedExitPrice);
    if (quantity <= 0 || quantity > position.quantityOpen)
      throw new Error("Invalid close quantity");
    if (exitPrice != null && exitPrice <= 0)
      throw new Error("Invalid exit price");

    const pendingRes = await pool.query(
      `SELECT id FROM position_close_requests WHERE position_id = $1 AND status = 'PENDING' LIMIT 1`,
      [position.positionId],
    );
    if (pendingRes.rows[0])
      throw new Error(
        "There is already a pending close request for this position",
      );

    const { rows } = await pool.query(
      `INSERT INTO position_close_requests (
         position_id,
         initiated_by_user_id,
         initiated_by_role,
         requested_quantity,
         requested_exit_price,
         request_note,
         evidence_url,
         evidence_name,
         status,
         created_at,
         updated_at
       ) VALUES ($1, $2, 'INVESTOR', $3, $4, $5, $6, $7, 'PENDING', NOW(), NOW())
       RETURNING id`,
      [
        position.positionId,
        userId,
        quantity,
        exitPrice,
        payload.requestNote?.trim() || null,
        payload.evidenceUrl || null,
        payload.evidenceName || null,
      ],
    );

    await pool.query(
      `UPDATE portfolio_positions_simple
       SET status = 'PENDING_CLOSE', updated_at = NOW()
       WHERE id = $1 AND status IN ('OPEN', 'PARTIALLY_CLOSED')`,
      [position.positionId],
    );

    return { closeRequestId: Number(rows[0].id) };
  }

  private async executeApprovedClose(
    client: any,
    requestId: number,
    responderUserId: number,
    responseNote: string | null,
  ) {
    const requestRes = await client.query(
      `SELECT pcr.id,
              pcr.position_id,
              pcr.initiated_by_role,
              pcr.requested_quantity,
              pcr.requested_exit_price,
              pcr.evidence_url,
              pcr.evidence_name,
              pps.quantity_open,
              pps.entry_price,
              pps.symbol,
              pps.portfolio_id,
              pps.status,
              em.id AS member_id,
              em.user_id AS investor_user_id,
              pil.partner_account_id
       FROM position_close_requests pcr
       JOIN portfolio_positions_simple pps ON pps.id = pcr.position_id
       JOIN elite_portfolios_simple eps ON eps.id = pps.portfolio_id
       JOIN elite_members em ON em.id = eps.elite_member_id
       LEFT JOIN partner_investor_links pil
         ON pil.investor_user_id = em.user_id
        AND pil.status = 'ACTIVE'
       WHERE pcr.id = $1
         AND pcr.status = 'PENDING'
       FOR UPDATE OF pcr, pps`,
      [requestId],
    );

    const request = requestRes.rows[0];
    if (!request) throw new Error("Close request not found");

    const requestedQuantity = toNumber(request.requested_quantity);
    const quantityOpen = toNumber(request.quantity_open);
    if (requestedQuantity > quantityOpen) {
      throw new Error("Close quantity exceeds open quantity");
    }

    let exitPrice =
      request.requested_exit_price == null
        ? null
        : toNumber(request.requested_exit_price);
    if (!exitPrice) {
      const quotes = await this.priceCache.getQuotes(
        [request.symbol].filter(Boolean),
      );
      exitPrice = toNumber(
        quotes[request.symbol]?.price,
        toNumber(request.entry_price),
      );
    }

    const entryPrice = toNumber(request.entry_price);
    const realizedProfit = (exitPrice - entryPrice) * requestedQuantity;
    const grossCost = entryPrice * requestedQuantity;
    const grossExit = exitPrice * requestedQuantity;

    const feeSettings = await getActiveFeeSettings();
    const positiveProfit = Math.max(realizedProfit, 0);
    const firmShare = positiveProfit * (feeSettings.firmPercent / 100);
    const partnerShare = positiveProfit * (feeSettings.partnerPercent / 100);

    await client.query(
      `UPDATE position_close_requests
       SET status = 'EXECUTED',
           responded_by_user_id = $2,
           response_note = $3,
           responded_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [requestId, responderUserId, responseNote],
    );

    await client.query(
      `INSERT INTO position_closures_simple (
         position_id,
         close_request_id,
         closed_quantity,
         exit_price,
         gross_cost_amount,
         gross_exit_amount,
         realized_profit_amount,
         firm_profit_share_percent,
         firm_profit_share_amount,
         partner_profit_share_percent,
         partner_profit_share_amount,
         partner_account_id,
         evidence_url,
         evidence_name,
         closed_at,
         created_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
      [
        Number(request.position_id),
        requestId,
        requestedQuantity,
        exitPrice,
        grossCost,
        grossExit,
        realizedProfit,
        feeSettings.firmPercent,
        firmShare,
        feeSettings.partnerPercent,
        partnerShare,
        request.partner_account_id ? Number(request.partner_account_id) : null,
        request.evidence_url || null,
        request.evidence_name || null,
      ],
    );

    const remaining = quantityOpen - requestedQuantity;
    await client.query(
      `UPDATE portfolio_positions_simple
       SET quantity_open = $2,
           status = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [
        Number(request.position_id),
        remaining,
        remaining <= 0 ? "CLOSED" : "PARTIALLY_CLOSED",
      ],
    );

    const nextFreeCapital = await this.adjustFreeCapital(
      client,
      Number(request.member_id),
      Number(request.portfolio_id),
      grossExit,
    );

    return {
      realizedProfit,
      firmShare,
      partnerShare,
      currentCapitalAmount: nextFreeCapital,
    };
  }

  async respondInvestorCloseRequest(
    userId: number,
    requestId: number,
    decision: string,
    responseNote?: string | null,
    evidenceUrl?: string | null,
    evidenceName?: string | null,
  ) {
    const normalizedDecision = normalizeDecision(decision);
    const context = await this.getInvestorContext(userId);

    const ownership = await pool.query(
      `SELECT pcr.id, pcr.initiated_by_role
       FROM position_close_requests pcr
       JOIN portfolio_positions_simple pps ON pps.id = pcr.position_id
       WHERE pcr.id = $1
         AND pps.portfolio_id = $2
         AND pcr.status = 'PENDING'
       LIMIT 1`,
      [requestId, context.portfolioId],
    );
    if (!ownership.rows[0]) throw new Error("Close request not found");
    if (ownership.rows[0].initiated_by_role !== "ADMIN") {
      throw new Error("Only admin initiated requests can be answered here");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (normalizedDecision === "REJECTED") {
        await client.query(
          `UPDATE position_close_requests
           SET status = 'REJECTED',
               responded_by_user_id = $2,
               response_note = $3,
               responded_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [requestId, userId, responseNote?.trim() || null],
        );
        await client.query(
          `UPDATE portfolio_positions_simple pps
           SET status = CASE
               WHEN EXISTS (SELECT 1 FROM position_closures_simple pcs WHERE pcs.position_id = pps.id) THEN 'PARTIALLY_CLOSED'
               ELSE 'OPEN'
             END,
               updated_at = NOW()
           FROM position_close_requests pcr
           WHERE pcr.id = $1 AND pps.id = pcr.position_id AND pps.status = 'PENDING_CLOSE'`,
          [requestId],
        );
      } else {
        await client.query(
          `UPDATE position_close_requests
           SET evidence_url = COALESCE($2, evidence_url),
               evidence_name = COALESCE($3, evidence_name),
               updated_at = NOW()
           WHERE id = $1`,
          [requestId, evidenceUrl || null, evidenceName || null],
        );
        await this.executeApprovedClose(
          client,
          requestId,
          userId,
          responseNote?.trim() || null,
        );
      }
      await client.query("COMMIT");
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getAdminInvestorDetail(memberId: number) {
    const investorRes = await pool.query(
      `SELECT em.id AS "memberId",
              em.user_id AS "userId",
              em.status AS "memberStatus",
              em.current_capital_amount AS "memberCapital",
              eps.id AS "portfolioId",
              eps.current_capital_amount AS "portfolioCapital",
              ea.id AS "applicationId",
              ea.status AS "applicationStatus",
              COALESCE(ea.phone_number, u.phonenumber, '') AS "phoneNumber",
              ea.investment_amount AS "investmentAmount",
              ea.description,
              COALESCE(${displayNameSql}, u.email) AS "investorName",
              u.email,
              pa.id AS "partnerId",
              pa.display_name AS "partnerName"
       FROM elite_members em
       JOIN users u ON u.id = em.user_id
       LEFT JOIN elite_portfolios_simple eps ON eps.elite_member_id = em.id
       LEFT JOIN elite_applications ea ON ea.id = em.application_id
       LEFT JOIN partner_investor_links pil ON pil.investor_user_id = em.user_id AND pil.status IN ('PENDING','ACTIVE')
       LEFT JOIN partner_accounts pa ON pa.id = COALESCE(pil.partner_account_id, ea.partner_account_id)
       WHERE em.id = $1
       LIMIT 1`,
      [memberId],
    );

    const investor = investorRes.rows[0];
    if (!investor) throw new Error("Investor not found");

    const plans = await this.getInvestorPlans(Number(investor.userId));
    const portfolio = await this.getInvestorPortfolio(Number(investor.userId));

    return {
      memberId,
      userId: Number(investor.userId),
      memberStatus: investor.memberStatus,
      investorName: investor.investorName,
      email: investor.email,
      phoneNumber: investor.phoneNumber,
      investmentAmount: toNumber(investor.investmentAmount),
      currentCapitalAmount: toNumber(
        investor.portfolioCapital || investor.memberCapital,
      ),
      partnerId: investor.partnerId ? Number(investor.partnerId) : null,
      partnerName: investor.partnerName ?? null,
      description: investor.description,
      plans,
      portfolio,
    };
  }

  async createAdminTradePlan(
    memberId: number,
    adminUserId: number,
    payload: {
      symbol: string;
      companyName?: string | null;
      referenceMarketPrice?: number | null;
      targetEntryPrice?: number | null;
      targetPrice1?: number | null;
      targetPrice2?: number | null;
      stopLossPrice?: number | null;
      suggestedQuantity: number;
      plannedAt?: string | null;
      adminNote?: string | null;
    },
  ) {
    const investorRes = await pool.query(
      `SELECT eps.id AS portfolio_id
       FROM elite_portfolios_simple eps
       WHERE eps.elite_member_id = $1
       LIMIT 1`,
      [memberId],
    );
    const portfolioId = Number(investorRes.rows[0]?.portfolio_id || 0);
    if (!portfolioId) throw new Error("Portfolio not found");

    const symbol = String(payload.symbol || "")
      .trim()
      .toUpperCase();
    if (!symbol || toNumber(payload.suggestedQuantity) <= 0) {
      throw new Error("Invalid plan payload");
    }

    const { rows } = await pool.query(
      `INSERT INTO trade_plans (
         portfolio_id,
         created_by_admin_id,
         symbol,
         company_name,
         plan_side,
         reference_market_price,
         target_entry_price,
         target_price_1,
         target_price_2,
         stop_loss_price,
         suggested_quantity,
         planned_at,
         admin_note,
         investor_decision,
         status,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, 'LONG', $5, $6, $7, $8, $9, $10, COALESCE($11::timestamptz, NOW()), $12, 'PENDING', 'SENT', NOW(), NOW())
       RETURNING id`,
      [
        portfolioId,
        adminUserId,
        symbol,
        payload.companyName?.trim() || null,
        payload.referenceMarketPrice == null
          ? null
          : toNumber(payload.referenceMarketPrice),
        payload.targetEntryPrice == null
          ? null
          : toNumber(payload.targetEntryPrice),
        payload.targetPrice1 == null ? null : toNumber(payload.targetPrice1),
        payload.targetPrice2 == null ? null : toNumber(payload.targetPrice2),
        payload.stopLossPrice == null ? null : toNumber(payload.stopLossPrice),
        toNumber(payload.suggestedQuantity),
        payload.plannedAt || null,
        payload.adminNote?.trim() || null,
      ],
    );

    return { planId: Number(rows[0].id) };
  }

  async addAdminPlanMessage(
    adminUserId: number,
    planId: number,
    message: string,
  ) {
    const text = String(message || "").trim();
    if (!text) throw new Error("Message is required");
    await pool.query(
      `INSERT INTO trade_plan_messages (trade_plan_id, sender_user_id, sender_role, message_text, created_at)
       VALUES ($1, $2, 'ADMIN', $3, NOW())`,
      [planId, adminUserId, text],
    );
    return { success: true };
  }

  async requestAdminClose(
    adminUserId: number,
    payload: {
      positionId: number;
      requestedQuantity: number;
      requestedExitPrice?: number | null;
      requestNote?: string | null;
    },
  ) {
    const posRes = await pool.query(
      `SELECT id, quantity_open FROM portfolio_positions_simple WHERE id = $1 LIMIT 1`,
      [payload.positionId],
    );
    const position = posRes.rows[0];
    if (!position) throw new Error("Position not found");
    const quantity = toNumber(payload.requestedQuantity);
    if (quantity <= 0 || quantity > toNumber(position.quantity_open)) {
      throw new Error("Invalid close quantity");
    }
    const exitPrice =
      payload.requestedExitPrice == null
        ? null
        : toNumber(payload.requestedExitPrice);

    const pendingRes = await pool.query(
      `SELECT id FROM position_close_requests WHERE position_id = $1 AND status = 'PENDING' LIMIT 1`,
      [payload.positionId],
    );
    if (pendingRes.rows[0])
      throw new Error(
        "There is already a pending close request for this position",
      );

    const { rows } = await pool.query(
      `INSERT INTO position_close_requests (
         position_id,
         initiated_by_user_id,
         initiated_by_role,
         requested_quantity,
         requested_exit_price,
         request_note,
         status,
         created_at,
         updated_at
       ) VALUES ($1, $2, 'ADMIN', $3, $4, $5, 'PENDING', NOW(), NOW())
       RETURNING id`,
      [
        payload.positionId,
        adminUserId,
        quantity,
        exitPrice,
        payload.requestNote?.trim() || null,
      ],
    );

    await pool.query(
      `UPDATE portfolio_positions_simple
       SET status = 'PENDING_CLOSE', updated_at = NOW()
       WHERE id = $1 AND status IN ('OPEN', 'PARTIALLY_CLOSED')`,
      [payload.positionId],
    );

    return { closeRequestId: Number(rows[0].id) };
  }

  async respondAdminCloseRequest(
    adminUserId: number,
    requestId: number,
    decision: string,
    responseNote?: string | null,
  ) {
    const normalizedDecision = normalizeDecision(decision);
    const reqRes = await pool.query(
      `SELECT initiated_by_role FROM position_close_requests WHERE id = $1 LIMIT 1`,
      [requestId],
    );
    if (!reqRes.rows[0]) throw new Error("Close request not found");
    if (reqRes.rows[0].initiated_by_role !== "INVESTOR") {
      throw new Error("Only investor initiated requests can be answered here");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (normalizedDecision === "REJECTED") {
        await client.query(
          `UPDATE position_close_requests
           SET status = 'REJECTED',
               responded_by_user_id = $2,
               response_note = $3,
               responded_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [requestId, adminUserId, responseNote?.trim() || null],
        );
        await client.query(
          `UPDATE portfolio_positions_simple pps
           SET status = CASE
               WHEN EXISTS (SELECT 1 FROM position_closures_simple pcs WHERE pcs.position_id = pps.id) THEN 'PARTIALLY_CLOSED'
               ELSE 'OPEN'
             END,
               updated_at = NOW()
           FROM position_close_requests pcr
           WHERE pcr.id = $1 AND pps.id = pcr.position_id AND pps.status = 'PENDING_CLOSE'`,
          [requestId],
        );
      } else {
        await this.executeApprovedClose(
          client,
          requestId,
          adminUserId,
          responseNote?.trim() || null,
        );
      }
      await client.query("COMMIT");
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createInvestorPayoutRequest(userId: number) {
    const context = await this.getInvestorContext(userId);
    const portfolio = await this.getInvestorPortfolio(userId);

    await pool.query(
      `INSERT INTO elite_activity_logs (
         actor_user_id,
         entity_type,
         entity_id,
         action,
         note,
         metadata,
         created_at
       ) VALUES ($1, 'ELITE_MEMBER', $2, 'PAYOUT_REQUESTED', $3, $4::jsonb, NOW())`,
      [
        userId,
        context.memberId,
        "Investor payout request placeholder created. Stripe flow pending.",
        JSON.stringify({
          freeCapitalAmount: portfolio.summary.freeCapitalAmount,
          investorProfit: portfolio.summary.investorProfit,
          totalEquity: portfolio.summary.totalEquity,
          status: "PENDING_STRIPE",
        }),
      ],
    );

    return {
      success: true,
      status: "PENDING_STRIPE",
      message: "Payout request saved. Stripe checkout will be connected later.",
    };
  }

  async listFirmBankAccounts() {
    const { rows } = await pool.query(
      `SELECT id,
              account_name AS "accountName",
              bank_name AS "bankName",
              iban,
              swift_code AS "swiftCode",
              currency,
              country,
              instructions,
              is_active AS "isActive",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
       FROM firm_bank_accounts
       ORDER BY is_active DESC, updated_at DESC, id DESC`,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      accountName: row.accountName,
      bankName: row.bankName,
      iban: row.iban,
      swiftCode: row.swiftCode ?? null,
      currency: row.currency,
      country: row.country ?? null,
      instructions: row.instructions ?? null,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async getActiveFirmBankAccount() {
    const { rows } = await pool.query(
      `SELECT id,
              account_name AS "accountName",
              bank_name AS "bankName",
              iban,
              swift_code AS "swiftCode",
              currency,
              country,
              instructions,
              is_active AS "isActive"
       FROM firm_bank_accounts
       WHERE is_active = true
       ORDER BY updated_at DESC, id DESC
       LIMIT 1`,
    );

    const row = rows[0];
    if (!row) return null;
    return {
      id: Number(row.id),
      accountName: row.accountName,
      bankName: row.bankName,
      iban: row.iban,
      swiftCode: row.swiftCode ?? null,
      currency: row.currency,
      country: row.country ?? null,
      instructions: row.instructions ?? null,
      isActive: Boolean(row.isActive),
    };
  }

  async saveFirmBankAccount(
    adminUserId: number,
    payload: {
      id?: number | null;
      accountName: string;
      bankName: string;
      iban: string;
      swiftCode?: string | null;
      currency?: string | null;
      country?: string | null;
      instructions?: string | null;
      isActive?: boolean;
    },
  ) {
    const accountName = cleanText(payload.accountName, 150);
    const bankName = cleanText(payload.bankName, 150);
    const iban = normalizeIban(payload.iban);
    const swiftCode = cleanText(payload.swiftCode, 50) || null;
    const currency = cleanText(payload.currency || "USD", 3).toUpperCase();
    const country = cleanText(payload.country, 80) || null;
    const instructions = cleanText(payload.instructions, 2000) || null;
    const isActive = payload.isActive !== false;

    if (!accountName) throw new Error("Account name is required.");
    if (!bankName) throw new Error("Bank name is required.");
    if (iban.length < 12) throw new Error("Please enter a valid IBAN.");
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Currency must be a 3-letter code.");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (isActive) {
        await client.query(`UPDATE firm_bank_accounts SET is_active = false, updated_at = NOW()`);
      }

      let bankAccountId: number;
      if (payload.id) {
        const update = await client.query(
          `UPDATE firm_bank_accounts
           SET account_name = $2,
               bank_name = $3,
               iban = $4,
               swift_code = $5,
               currency = $6,
               country = $7,
               instructions = $8,
               is_active = $9,
               updated_at = NOW()
           WHERE id = $1
           RETURNING id`,
          [payload.id, accountName, bankName, iban, swiftCode, currency, country, instructions, isActive],
        );
        if (!update.rows[0]) throw new Error("Bank account not found.");
        bankAccountId = Number(update.rows[0].id);
      } else {
        const insert = await client.query(
          `INSERT INTO firm_bank_accounts (
             account_name,
             bank_name,
             iban,
             swift_code,
             currency,
             country,
             instructions,
             is_active,
             created_at,
             updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           RETURNING id`,
          [accountName, bankName, iban, swiftCode, currency, country, instructions, isActive],
        );
        bankAccountId = Number(insert.rows[0].id);
      }

      await client.query(
        `INSERT INTO elite_activity_logs (
           actor_user_id,
           entity_type,
           entity_id,
           action,
           note,
           metadata,
           created_at
         ) VALUES ($1, 'FIRM_BANK_ACCOUNT', $2, 'BANK_ACCOUNT_SAVED', $3, $4::jsonb, NOW())`,
        [
          adminUserId,
          bankAccountId,
          isActive ? "Firm bank account saved and activated." : "Firm bank account saved.",
          JSON.stringify({ accountName, bankName, currency, isActive }),
        ],
      );

      await client.query("COMMIT");
      return { success: true, bankAccountId };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createManualFirmProfitPaymentRequest(userId: number) {
    const context = await this.getInvestorContext(userId);
    const paymentSummary = await this.getFirmPaymentSummaryByPortfolioId(
      context.portfolioId,
    );
    const amountToPay = Number(
      paymentSummary.summary.firmProfitOutstanding.toFixed(2),
    );

    if (amountToPay <= 0) {
      throw new Error("There is no unpaid firm profit right now.");
    }

    const bankAccount = await this.getActiveFirmBankAccount();
    if (!bankAccount) {
      throw new Error("Bank transfer is not available because no active firm bank account is configured.");
    }

    const existing = await pool.query(
      `SELECT id,
              amount_requested AS "amountRequested",
              manual_reference AS "manualReference",
              status,
              created_at AS "createdAt"
       FROM firm_profit_payments
       WHERE portfolio_id = $1
         AND COALESCE(payment_method, 'STRIPE') = 'BANK_TRANSFER'
         AND status IN ('AWAITING_TRANSFER', 'PROOF_SUBMITTED', 'UNDER_REVIEW')
       ORDER BY created_at DESC
       LIMIT 1`,
      [context.portfolioId],
    );

    if (existing.rows[0]) {
      const existingAmount = toNumber(existing.rows[0].amountRequested);
      if (Math.abs(existingAmount - amountToPay) > 0.01) {
        throw new Error("A bank-transfer request is already pending but the full due amount changed. Ask admin to reject it, then generate a fresh full-value request.");
      }
      return {
        success: true,
        reused: true,
        paymentId: Number(existing.rows[0].id),
        amount: existingAmount,
        currency: bankAccount.currency,
        status: existing.rows[0].status,
        manualReference: existing.rows[0].manualReference,
        bankAccount,
      };
    }

    const insert = await pool.query(
      `INSERT INTO firm_profit_payments (
         elite_member_id,
         portfolio_id,
         investor_user_id,
         currency,
         amount_requested,
         amount_paid,
         status,
         payment_method,
         bank_account_id,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, 0, 'AWAITING_TRANSFER', 'BANK_TRANSFER', $6, NOW(), NOW())
       RETURNING id`,
      [
        context.memberId,
        context.portfolioId,
        userId,
        bankAccount.currency,
        amountToPay,
        bankAccount.id,
      ],
    );

    const paymentId = Number(insert.rows[0].id);
    const manualReference = generateManualFirmProfitReference(
      context.memberId,
      paymentId,
    );

    await pool.query(
      `UPDATE firm_profit_payments
       SET manual_reference = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [paymentId, manualReference],
    );

    return {
      success: true,
      reused: false,
      paymentId,
      amount: amountToPay,
      currency: bankAccount.currency,
      status: "AWAITING_TRANSFER",
      manualReference,
      bankAccount,
    };
  }

  async submitManualFirmProfitPaymentProof(
    userId: number,
    paymentId: number,
    payload: {
      proofUrl: string;
      proofName?: string | null;
      transferReference?: string | null;
      note?: string | null;
    },
  ) {
    const proofUrl = cleanText(payload.proofUrl, 1000);
    const proofName = cleanText(payload.proofName, 255) || null;
    const transferReference = cleanText(payload.transferReference, 120) || null;
    const note = cleanText(payload.note, 1000) || null;

    if (!proofUrl) throw new Error("Transfer proof is required.");

    const { rows } = await pool.query(
      `UPDATE firm_profit_payments
       SET status = 'PROOF_SUBMITTED',
           proof_url = $3,
           proof_name = $4,
           transfer_reference = $5,
           review_note = $6,
           submitted_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND investor_user_id = $2
         AND COALESCE(payment_method, 'STRIPE') = 'BANK_TRANSFER'
         AND status IN ('AWAITING_TRANSFER', 'REJECTED')
       RETURNING id`,
      [paymentId, userId, proofUrl, proofName, transferReference, note],
    );

    if (!rows[0]) {
      throw new Error("Bank-transfer payment request was not found or cannot accept proof now.");
    }

    return { success: true, paymentId };
  }

  async listAdminFirmProfitPayments(status?: string | null) {
    const values: any[] = [];
    let where = "";
    const normalizedStatus = cleanText(status, 30).toUpperCase();
    if (normalizedStatus && normalizedStatus !== "ALL") {
      values.push(normalizedStatus);
      where = `WHERE fpp.status = $1`;
    }

    const { rows } = await pool.query(
      `SELECT fpp.id,
              fpp.elite_member_id AS "eliteMemberId",
              fpp.portfolio_id AS "portfolioId",
              fpp.investor_user_id AS "investorUserId",
              COALESCE(${displayNameSql}, u.email) AS "investorName",
              u.email AS "investorEmail",
              fpp.currency,
              fpp.amount_requested AS "amountRequested",
              fpp.amount_paid AS "amountPaid",
              fpp.status,
              COALESCE(fpp.payment_method, 'STRIPE') AS "paymentMethod",
              fpp.manual_reference AS "manualReference",
              fpp.transfer_reference AS "transferReference",
              fpp.proof_url AS "proofUrl",
              fpp.proof_name AS "proofName",
              fpp.review_note AS "reviewNote",
              fpp.submitted_at AS "submittedAt",
              fpp.reviewed_at AS "reviewedAt",
              fpp.paid_at AS "paidAt",
              fpp.created_at AS "createdAt",
              fba.account_name AS "bankAccountName",
              fba.bank_name AS "bankName",
              fba.iban
       FROM firm_profit_payments fpp
       JOIN users u ON u.id = fpp.investor_user_id
       LEFT JOIN firm_bank_accounts fba ON fba.id = fpp.bank_account_id
       ${where}
       ORDER BY
         CASE fpp.status
           WHEN 'PROOF_SUBMITTED' THEN 1
           WHEN 'UNDER_REVIEW' THEN 2
           WHEN 'AWAITING_TRANSFER' THEN 3
           WHEN 'REJECTED' THEN 4
           WHEN 'CHECKOUT_CREATED' THEN 5
           WHEN 'PAID' THEN 6
           ELSE 7
         END,
         fpp.created_at DESC
       LIMIT 200`,
      values,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      eliteMemberId: Number(row.eliteMemberId),
      portfolioId: Number(row.portfolioId),
      investorUserId: Number(row.investorUserId),
      investorName: row.investorName,
      investorEmail: row.investorEmail,
      currency: row.currency,
      amountRequested: toNumber(row.amountRequested),
      amountPaid: toNumber(row.amountPaid),
      status: row.status,
      paymentMethod: row.paymentMethod,
      manualReference: row.manualReference ?? null,
      transferReference: row.transferReference ?? null,
      proofUrl: row.proofUrl ?? null,
      proofName: row.proofName ?? null,
      reviewNote: row.reviewNote ?? null,
      submittedAt: row.submittedAt ?? null,
      reviewedAt: row.reviewedAt ?? null,
      paidAt: row.paidAt ?? null,
      createdAt: row.createdAt,
      bankAccountName: row.bankAccountName ?? null,
      bankName: row.bankName ?? null,
      iban: row.iban ?? null,
    }));
  }

  async reviewManualFirmProfitPayment(
    adminUserId: number,
    paymentId: number,
    payload: { decision: "APPROVE" | "REJECT"; reviewNote?: string | null },
  ) {
    const decision = cleanText(payload.decision, 20).toUpperCase();
    const reviewNote = cleanText(payload.reviewNote, 1000) || null;
    if (!["APPROVE", "REJECT"].includes(decision)) {
      throw new Error("Invalid review decision.");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const paymentRes = await client.query(
        `SELECT id,
                elite_member_id,
                portfolio_id,
                investor_user_id,
                amount_requested,
                status,
                payment_method,
                proof_url
         FROM firm_profit_payments
         WHERE id = $1
         FOR UPDATE`,
        [paymentId],
      );
      const payment = paymentRes.rows[0];
      if (!payment) throw new Error("Payment not found.");
      if (String(payment.payment_method || "STRIPE") !== "BANK_TRANSFER") {
        throw new Error("Only bank-transfer payments can be manually reviewed here.");
      }
      if (!["PROOF_SUBMITTED", "UNDER_REVIEW"].includes(String(payment.status))) {
        throw new Error("Payment proof is not ready for admin review.");
      }
      if (!payment.proof_url) {
        throw new Error("Cannot approve or reject a bank transfer without proof.");
      }

      if (decision === "REJECT") {
        await client.query(
          `UPDATE firm_profit_payments
           SET status = 'REJECTED',
               reviewed_by = $2,
               reviewed_at = NOW(),
               review_note = $3,
               updated_at = NOW()
           WHERE id = $1`,
          [paymentId, adminUserId, reviewNote || "Rejected by admin."],
        );
      } else {
        const currentSummary = await this.getFirmPaymentSummaryByPortfolioId(
          Number(payment.portfolio_id),
        );
        const currentOutstanding = Number(
          currentSummary.summary.firmProfitOutstanding.toFixed(2),
        );
        const requestedAmount = Number(toNumber(payment.amount_requested).toFixed(2));
        if (Math.abs(currentOutstanding - requestedAmount) > 0.01) {
          throw new Error("Cannot approve this transfer because it no longer equals the full current firm-profit due. Reject it and ask the investor to create a fresh full-value transfer request.");
        }

        await client.query(
          `UPDATE firm_profit_payments
           SET status = 'PAID',
               amount_paid = amount_requested,
               paid_at = NOW(),
               reviewed_by = $2,
               reviewed_at = NOW(),
               review_note = $3,
               updated_at = NOW()
           WHERE id = $1`,
          [paymentId, adminUserId, reviewNote || "Bank transfer verified and approved by admin."],
        );
        await this.allocateFirmProfitPayment(client, paymentId);
      }

      await client.query(
        `INSERT INTO elite_activity_logs (
           actor_user_id,
           entity_type,
           entity_id,
           action,
           note,
           metadata,
           created_at
         ) VALUES ($1, 'FIRM_PROFIT_PAYMENT', $2, $3, $4, $5::jsonb, NOW())`,
        [
          adminUserId,
          paymentId,
          decision === "APPROVE" ? "BANK_TRANSFER_APPROVED" : "BANK_TRANSFER_REJECTED",
          reviewNote,
          JSON.stringify({ decision, paymentId }),
        ],
      );

      await client.query("COMMIT");
      return { success: true };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createFirmProfitCheckoutSession(
    userId: number,
    payload?: { origin?: string | null; returnPath?: string | null },
  ) {
    const context = await this.getInvestorContext(userId);
    const paymentSummary = await this.getFirmPaymentSummaryByPortfolioId(
      context.portfolioId,
    );
    const amountToPay = Number(
      paymentSummary.summary.firmProfitOutstanding.toFixed(2),
    );

    if (amountToPay <= 0) {
      throw new Error("There is no unpaid firm profit right now.");
    }

    const baseUrl = this.getAppBaseUrl(payload?.origin);
    if (!baseUrl) {
      throw new Error(
        "App base URL is not configured. Set NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL.",
      );
    }
    const returnPath = this.sanitizeReturnPath(payload?.returnPath);
    const successUrl = `${baseUrl}${returnPath}?firmProfitPayment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}${returnPath}?firmProfitPayment=cancelled`;

    const existingCheckout = await pool.query(
      `SELECT id,
              checkout_url AS "checkoutUrl"
       FROM firm_profit_payments
       WHERE portfolio_id = $1
         AND amount_requested = $2
         AND COALESCE(payment_method, 'STRIPE') = 'STRIPE'
         AND status = 'CHECKOUT_CREATED'
         AND checkout_url IS NOT NULL
         AND (checkout_expires_at IS NULL OR checkout_expires_at > NOW())
       ORDER BY created_at DESC
       LIMIT 1`,
      [context.portfolioId, amountToPay],
    );
    if (existingCheckout.rows[0]?.checkoutUrl) {
      return {
        success: true,
        url: existingCheckout.rows[0].checkoutUrl,
        paymentId: Number(existingCheckout.rows[0].id),
        amount: amountToPay,
      };
    }

    const userEmail = await this.getUserEmail(userId);

    const paymentInsert = await pool.query(
      `INSERT INTO firm_profit_payments (
         elite_member_id,
         portfolio_id,
         investor_user_id,
         currency,
         amount_requested,
         amount_paid,
         status,
         payment_method,
         stripe_customer_email,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, 'USD', $4, 0, 'PENDING', 'STRIPE', $5, NOW(), NOW())
       RETURNING id`,
      [context.memberId, context.portfolioId, userId, amountToPay, userEmail],
    );
    const paymentId = Number(paymentInsert.rows[0].id);

    try {
      const stripe = getStripeClient();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: userEmail || undefined,
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          program_type: "ELITE_FIRM_PROFIT",
          firm_profit_payment_id: String(paymentId),
          elite_member_id: String(context.memberId),
          portfolio_id: String(context.portfolioId),
          investor_user_id: String(userId),
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: toStripeUnitAmount(amountToPay),
              product_data: {
                name: "Elite firm profit payment",
                description: `Elite member #${context.memberId} outstanding firm profit`,
              },
            },
          },
        ],
      });

      await pool.query(
        `UPDATE firm_profit_payments
         SET status = 'CHECKOUT_CREATED',
             stripe_checkout_session_id = $2,
             checkout_url = $3,
             checkout_expires_at = CASE WHEN $4::double precision IS NULL THEN NULL ELSE TO_TIMESTAMP($4::double precision) END,
             raw_payload = $5::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [
          paymentId,
          session.id,
          session.url || null,
          session.expires_at || null,
          JSON.stringify(session),
        ],
      );

      return {
        success: true,
        paymentId,
        url: session.url,
        amount: amountToPay,
      };
    } catch (error: any) {
      await pool.query(
        `UPDATE firm_profit_payments
         SET status = 'FAILED',
             raw_payload = $2::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [
          paymentId,
          JSON.stringify({ message: error?.message || "Stripe error" }),
        ],
      );
      throw error;
    }
  }

  async finalizeFirmProfitPaymentFromStripe(
    checkoutSessionId: string,
    payload: any,
  ) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const paymentRes = await client.query(
        `SELECT id,
                status,
                amount_requested
         FROM firm_profit_payments
         WHERE stripe_checkout_session_id = $1
         FOR UPDATE`,
        [checkoutSessionId],
      );
      const payment = paymentRes.rows[0];
      if (!payment) {
        throw new Error(
          "Firm profit payment record not found for Stripe session.",
        );
      }
      if (payment.status === "PAID") {
        await client.query("COMMIT");
        return { success: true, alreadyProcessed: true };
      }

      const amountPaid = toNumber(payload?.amount_total, 0) / 100;

      await client.query(
        `UPDATE firm_profit_payments
         SET status = 'PAID',
             amount_paid = $2,
             stripe_payment_intent_id = $3,
             paid_at = NOW(),
             raw_payload = $4::jsonb,
             updated_at = NOW()
         WHERE id = $1`,
        [
          Number(payment.id),
          amountPaid,
          payload?.payment_intent ? String(payload.payment_intent) : null,
          JSON.stringify(payload),
        ],
      );

      await this.allocateFirmProfitPayment(client, Number(payment.id));

      await client.query("COMMIT");
      return { success: true, amountPaid };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async expireFirmProfitPaymentFromStripe(
    checkoutSessionId: string,
    payload: any,
  ) {
    await pool.query(
      `UPDATE firm_profit_payments
       SET status = CASE WHEN status = 'PAID' THEN status ELSE 'EXPIRED' END,
           raw_payload = $2::jsonb,
           updated_at = NOW()
       WHERE stripe_checkout_session_id = $1`,
      [checkoutSessionId, JSON.stringify(payload)],
    );
    return { success: true };
  }

  async createPartnerPayoutRequest(
    userId: number,
    payload: { iban: string; amount?: number | null; note?: string | null },
  ) {
    const partner = await this.getPartnerAccountByUserId(userId);
    if (!partner || partner.status !== "APPROVED") {
      throw new Error("Only approved partners can request payout.");
    }

    const iban = normalizeIban(payload.iban);
    if (iban.length < 12) {
      throw new Error("Please enter a valid IBAN.");
    }

    const payout = await this.getPartnerPayoutSummary(Number(partner.id));
    const amount =
      payload.amount == null
        ? payout.summary.availableToRequestAmount
        : Number(Number(payload.amount).toFixed(2));

    if (amount <= 0) {
      throw new Error(
        "There is no unlocked partner profit available to request.",
      );
    }
    if (amount > payout.summary.availableToRequestAmount + 0.001) {
      throw new Error(
        "Requested amount is higher than the unlocked partner profit.",
      );
    }

    await pool.query(
      `UPDATE partner_accounts
       SET iban = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [partner.id, iban],
    );

    const { rows } = await pool.query(
      `INSERT INTO partner_payout_requests (
         partner_account_id,
         requested_amount,
         iban_snapshot,
         note,
         status,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, 'PENDING', NOW(), NOW())
       RETURNING id`,
      [Number(partner.id), amount, iban, payload.note?.trim() || null],
    );

    return {
      success: true,
      requestId: Number(rows[0].id),
      amount,
      iban,
      message:
        "Partner payout request saved. Admin can now review the IBAN and transfer manually.",
    };
  }

  async listEligibleUsersForManualEliteMember(query?: string | null) {
    const normalizedQuery = String(query || "").trim();
    const values: unknown[] = [];
    let where = `WHERE COALESCE(u.role, 'user') <> 'admin'
       AND NOT EXISTS (
         SELECT 1 FROM elite_members em WHERE em.user_id = u.id
       )`;

    if (normalizedQuery) {
      values.push(`%${normalizedQuery.toLowerCase()}%`);
      where += `
       AND (
         LOWER(COALESCE(u.email, '')) LIKE $1
         OR LOWER(COALESCE(u.firstname, '')) LIKE $1
         OR LOWER(COALESCE(u.lastname, '')) LIKE $1
       )`;
    }

    const { rows } = await pool.query(
      `SELECT u.id,
              COALESCE(${displayNameSql}, u.email) AS "displayName",
              u.email,
              u.phonenumber AS "phoneNumber"
       FROM users u
       ${where}
       ORDER BY u.created_at DESC NULLS LAST, u.id DESC
       LIMIT 25`,
      values,
    );

    return rows.map((row) => ({
      id: Number(row.id),
      displayName: row.displayName,
      email: row.email,
      phoneNumber: row.phoneNumber ?? null,
    }));
  }

  async createManualEliteMemberFromUser(
    userId: number,
    adminUserId: number,
    payload: {
      currentCapitalAmount: number;
      note?: string | null;
      partnerAccountId?: number | null;
    },
  ) {
    const currentCapitalAmount = Math.max(
      toNumber(payload.currentCapitalAmount),
      0,
    );
    if (!userId || currentCapitalAmount <= 0) {
      throw new Error("Invalid manual elite member data");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userRes = await client.query(
        `SELECT id FROM users WHERE id = $1 LIMIT 1`,
        [userId],
      );
      if (!userRes.rows[0]) {
        throw new Error("User not found");
      }
      let partnerAccountId: number | null = null;
      let referralCodeUsed: string | null = null;

      if (payload.partnerAccountId) {
        const partnerRes = await client.query(
          `SELECT id, referral_code, status
     FROM partner_accounts
     WHERE id = $1
     LIMIT 1`,
          [payload.partnerAccountId],
        );

        const partner = partnerRes.rows[0];
        if (!partner) {
          throw new Error("Selected partner not found");
        }

        if (partner.status !== "APPROVED") {
          throw new Error("Selected partner is not approved");
        }

        partnerAccountId = Number(partner.id);
        referralCodeUsed = partner.referral_code ?? null;
      }
      const memberRes = await client.query(
        `INSERT INTO elite_members (
           user_id,
           application_id,
           approved_at,
           is_active,
           created_at,
           approved_by,
           current_capital_amount,
           capital_updated_at,
           status
         ) VALUES ($1, NULL, NOW(), true, NOW(), $2, $3, NOW(), 'ACTIVE')
         ON CONFLICT (user_id) DO UPDATE
         SET approved_at = NOW(),
             is_active = true,
             approved_by = EXCLUDED.approved_by,
             current_capital_amount = EXCLUDED.current_capital_amount,
             capital_updated_at = NOW(),
             status = 'ACTIVE'
         RETURNING id`,
        [userId, adminUserId, currentCapitalAmount],
      );
      const memberId = Number(memberRes.rows[0].id);

      await client.query(
        `INSERT INTO elite_portfolios_simple (
           elite_member_id,
           current_capital_amount,
           currency,
           status,
           note,
           created_at,
           updated_at
         ) VALUES ($1, $2, 'USD', 'ACTIVE', $3, NOW(), NOW())
         ON CONFLICT (elite_member_id) DO UPDATE
         SET current_capital_amount = EXCLUDED.current_capital_amount,
             status = 'ACTIVE',
             note = COALESCE(EXCLUDED.note, elite_portfolios_simple.note),
             updated_at = NOW()`,
        [
          memberId,
          currentCapitalAmount,
          payload.note?.trim() || "Manually created by admin",
        ],
      );
      if (partnerAccountId) {
        await client.query(
          `INSERT INTO partner_investor_links (
       partner_account_id,
       investor_user_id,
       elite_application_id,
       elite_member_id,
       referral_code_used,
       status,
       linked_at,
       activated_at,
       created_at,
       updated_at
     )
     VALUES ($1, $2, NULL, $3, $4, 'ACTIVE', NOW(), NOW(), NOW(), NOW())
     ON CONFLICT (investor_user_id) DO UPDATE
     SET partner_account_id = EXCLUDED.partner_account_id,
         elite_member_id = EXCLUDED.elite_member_id,
         referral_code_used = EXCLUDED.referral_code_used,
         status = 'ACTIVE',
         activated_at = NOW(),
         deactivated_at = NULL,
         updated_at = NOW()`,
          [partnerAccountId, userId, memberId, referralCodeUsed],
        );
      } else {
        await client.query(
          `DELETE FROM partner_investor_links
     WHERE investor_user_id = $1`,
          [userId],
        );
      }
      await client.query(
        `INSERT INTO elite_activity_logs (
           actor_user_id,
           entity_type,
           entity_id,
           action,
           note,
           metadata,
           created_at
         ) VALUES ($1, 'ELITE_MEMBER', $2, 'MANUAL_MEMBER_CREATED', $3, $4::jsonb, NOW())`,
        [
          adminUserId,
          memberId,
          payload.note?.trim() ||
            "Admin created Elite member manually from users table.",
          JSON.stringify({ userId, currentCapitalAmount }),
        ],
      );

      await client.query("COMMIT");
      return { success: true, memberId, userId, currentCapitalAmount };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async createAdminPayoutRequest(memberId: number, adminUserId: number) {
    const investorRes = await pool.query(
      `SELECT user_id
       FROM elite_members
       WHERE id = $1
       LIMIT 1`,
      [memberId],
    );
    const investorUserId = Number(investorRes.rows[0]?.user_id || 0);
    if (!investorUserId) {
      throw new Error("Investor not found");
    }

    const portfolio = await this.getInvestorPortfolio(investorUserId);

    await pool.query(
      `INSERT INTO elite_activity_logs (
         actor_user_id,
         entity_type,
         entity_id,
         action,
         note,
         metadata,
         created_at
       ) VALUES ($1, 'ELITE_MEMBER', $2, 'ADMIN_PAYOUT_REQUESTED', $3, $4::jsonb, NOW())`,
      [
        adminUserId,
        memberId,
        "Admin-side payout request placeholder created. Stripe flow pending.",
        JSON.stringify({
          investorUserId,
          investorProfit: portfolio.summary.investorProfit,
          freeCapitalAmount: portfolio.summary.freeCapitalAmount,
          status: "PENDING_STRIPE",
        }),
      ],
    );

    return {
      success: true,
      status: "PENDING_STRIPE",
      message:
        "Admin payout request placeholder saved. Stripe checkout will be connected later.",
    };
  }

  async getAdminReferralSummary() {
    const { rows } = await pool.query(
      `SELECT pil.id,
              pil.referral_code_used AS "referralCodeUsed",
              pil.status,
              pil.linked_at AS "linkedAt",
              COALESCE(${displayNameSql}, iu.email) AS "investorName",
              iu.email AS "investorEmail",
              pa.display_name AS "partnerName"
       FROM partner_investor_links pil
       JOIN users iu ON iu.id = pil.investor_user_id
       JOIN partner_accounts pa ON pa.id = pil.partner_account_id
       LEFT JOIN users u ON u.id = iu.id
       ORDER BY pil.created_at DESC`,
      [],
    );

    return rows.map((row) => ({
      id: Number(row.id),
      referralCodeUsed: row.referralCodeUsed,
      status: row.status,
      linkedAt: row.linkedAt,
      investorName: row.investorName,
      investorEmail: row.investorEmail,
      partnerName: row.partnerName,
    }));
  }
}
