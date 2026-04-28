import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Signal } from "@/types/signal";
import { Textarea } from "../ui/textarea";

interface EditSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  editSignal: Signal | null;
  setEditSignal: React.Dispatch<React.SetStateAction<Signal | null>>;
  handleEditSubmit: () => void;
}

export function EditSignalModal({
  isOpen,
  onClose,
  editSignal,
  setEditSignal,
  handleEditSubmit,
}: EditSignalModalProps) {
  if (!editSignal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[white]">
        <DialogHeader>
          <DialogTitle>Edit Signal</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEditSubmit();
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                Symbol
              </Label>
              <Input
                id="symbol"
                value={editSignal.symbol}
                onChange={(e) =>
                  setEditSignal({ ...editSignal, symbol: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="enterPrice" className="text-right">
                Enter Price
              </Label>
              <Input
                id="enterPrice"
                type="number"
                value={editSignal.enterPrice}
                onChange={(e) =>
                  setEditSignal({
                    ...editSignal,
                    enterPrice: Number(e.target.value),
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priceNow" className="text-right">
                Price Now
              </Label>
              <Input
                id="priceNow"
                type="number"
                value={editSignal.priceNow}
                onChange={(e) =>
                  setEditSignal({
                    ...editSignal,
                    priceNow: Number(e.target.value),
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstTarget" className="text-right">
                First Target
              </Label>
              <Input
                id="firstTarget"
                type="number"
                value={editSignal.firstTarget}
                onChange={(e) =>
                  setEditSignal({
                    ...editSignal,
                    firstTarget: Number(e.target.value),
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="secondTarget" className="text-right">
                Second Target
              </Label>
              <Input
                id="secondTarget"
                type="number"
                value={editSignal.secondTarget}
                onChange={(e) =>
                  setEditSignal({
                    ...editSignal,
                    secondTarget: Number(e.target.value),
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason_en" className="text-right">
                Reason English
              </Label>
              <Textarea
                id="reason_en"
                value={editSignal.reason_en}
                onChange={(e) =>
                  setEditSignal({ ...editSignal, reason_en: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason_ar" className="text-right">
                Reason Arabic
              </Label>
              <Textarea
                id="reason_ar"
                value={editSignal.reason_ar}
                onChange={(e) =>
                  setEditSignal({ ...editSignal, reason_ar: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" variant="default">
              Save changes
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
