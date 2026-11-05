import type { Employee } from "../types";
const weekly = (id: string, name: string, role: string, weeklyHours: number, station: Employee["station"]): Employee => ({
  id, name, role, weeklyHours, station: "BOTH", employmentType: weeklyHours >= 39 ? "VOLLZEIT" : "TEILZEIT", targetMinutes: weeklyHours * 60, shiftHours: weeklyHours >= 30 ? { min: 5, max: 8 } : { min: 3, max: 6 }, spreadEvenly: true,
});
export function zaikoEmployees(): Employee[] {
  return [
    weekly("zaiko-01", "Vũ Thị Thuỳ Dung", "Phục Vụ", 39, "SERVICE"),
    weekly("zaiko-02", "Vũ Hà My", "Phục Vụ", 12, "SERVICE"),
    weekly("zaiko-03", "Vũ Văn Tài", "Sushi", 28, "KITCHEN"),
    weekly("zaiko-04", "Phạm Thị Thuý Ngà", "Bếp", 22, "KITCHEN"),
    weekly("zaiko-05", "Nguyễn Thị Huyền Trang", "Bar", 17, "BOTH"),
    weekly("zaiko-06", "Vũ Thái Thành", "Bếp", 26, "KITCHEN"),
    weekly("zaiko-07", "Nguyễn Doãn Cường", "Bếp", 39, "KITCHEN"),
    weekly("zaiko-08", "Nguyễn Mỹ Tâm", "Bar", 9, "BOTH"),
    weekly("zaiko-09", "Hồ Thị Trâm Anh", "Bar", 9, "BOTH"),
    weekly("zaiko-10", "Phạm Thế Anh", "Sushi", 35, "KITCHEN"),
  ];
}
export const restaurantOwner = (): Employee => ({ id: "zaiko-owner", name: "Chủ", employmentType: "VOLLZEIT", station: "BOTH", targetMinutes: 0, ownerSupport: true });
export const LEMONTASTE_PATCHES: Record<string, Partial<Employee>> = {};
export const lemontasteEmployees = zaikoEmployees;
export const DINH_BIEN_SHIFT = { startMinutes: 1080, endMinutes: 1290 };
