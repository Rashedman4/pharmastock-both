import { NextRequest, NextResponse } from 'next/server';

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;
type MethodMap = Partial<Record<'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE', Handler>>;

export function apiHandler(methods: MethodMap) {
  return async function handler(
    req: NextRequest,
    ctx: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    const method = req.method as keyof MethodMap;
    const fn = methods[method];

    if (!fn) {
      return NextResponse.json(
        { error: { code: 'METHOD_NOT_ALLOWED', message: `${req.method} not allowed` } },
        { status: 405, headers: { Allow: Object.keys(methods).join(', ') } }
      );
    }

    try {
      return await fn(req, ctx);
    } catch (err) {
      console.error('[mobile-api]', err);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
        { status: 500 }
      );
    }
  };
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function err(
  code: string,
  message: string,
  status: number,
  field?: string
): NextResponse {
  return NextResponse.json(
    { error: { code, message, ...(field ? { field } : {}) } },
    { status }
  );
}
