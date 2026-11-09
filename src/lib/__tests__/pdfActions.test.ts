import { afterEach, expect, it, vi } from "vitest";
import { deliver, sharePdf } from "../pdf";
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("passes a PDF file to Safari native share directly from the click call", async () => {
 const share=vi.fn().mockResolvedValue(undefined);
 vi.stubGlobal("navigator", {canShare:vi.fn().mockReturnValue(true),share});
 const promise=sharePdf(new Blob(["pdf"]),"Zaiko.pdf");
 expect(share).toHaveBeenCalledTimes(1);
 const file=share.mock.calls[0][0].files[0];
 expect(file.name).toBe("Zaiko.pdf"); expect(file.type).toBe("application/pdf");
 expect(await promise).toBe("shared");
});
it("supports native share without canShare and handles cancellation", async () => {
 vi.stubGlobal("navigator", {share:vi.fn().mockRejectedValue(new DOMException("Cancel","AbortError"))});
 expect(await sharePdf(new Blob(["pdf"]),"Zaiko.pdf")).toBe("cancelled");
});
it("reports browsers that cannot share files", async () => {
 vi.stubGlobal("navigator", {share:vi.fn(),canShare:()=>false});
 expect(await sharePdf(new Blob(["pdf"]),"Zaiko.pdf")).toBe("unsupported");
});
it("save creates a PDF download link without a confirmation", () => {
 vi.useFakeTimers();
 const click=vi.fn(), appendChild=vi.fn(), removeChild=vi.fn();
 const anchor={click,style:{},href:"",download:"",rel:"",target:""};
 vi.stubGlobal("document",{createElement:()=>anchor,body:{appendChild,removeChild,contains:()=>true}});
 vi.spyOn(URL,"createObjectURL").mockReturnValue("blob:test");
 vi.spyOn(URL,"revokeObjectURL").mockImplementation(()=>{});
 deliver(new Blob(["pdf"]),"Zaiko.pdf");
 expect(anchor.download).toBe("Zaiko.pdf"); expect(anchor.target).toBe("_blank");
 expect(click).toHaveBeenCalledOnce();
 vi.runAllTimers(); vi.useRealTimers();
});
