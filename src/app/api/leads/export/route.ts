import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { leads, users, userExports, userExportedLeads } from "@/db/schema";
import { inArray, eq, sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadItems, format = "xlsx", userId } = body;

    if (!Array.isArray(leadItems) || leadItems.length === 0) {
      return NextResponse.json(
        { error: "Danh sách cơ sở xuất file không được để trống." },
        { status: 400 }
      );
    }

    // 1. Chuẩn bị dữ liệu xuất Excel đẹp mắt
    const rows = leadItems.map((item: any, idx: number) => {
      const isMobile =
        item.phone &&
        /^(0|\+84)(9|8|7|3|5)[0-9]{8}$/.test(item.phone.replace(/[^0-9+]/g, ""));

      return {
        STT: idx + 1,
        "Tên cơ sở kinh doanh": item.name || "Chưa có tên",
        "Ngành nghề": item.category || "Dịch vụ",
        "Số điện thoại": item.phone || "Chưa cập nhật",
        "Phân loại số": isMobile ? "Di động (Zalo sẵn sàng)" : "Số bàn / Hotline",
        "Địa chỉ chi tiết": item.location || item.address || "Việt Nam",
        "Đánh giá Google": item.rating ? `${item.rating} ⭐` : "Chưa có sao",
        "Trạng thái Website": item.website ? "Đã có website" : "Chưa có website (Cần chào làm web)",
        "Link Website": item.website || "Không có",
        "Link Google Maps": item.googleMapsUrl || item.googleMapsUrl || "",
        "Ghi chú tiếp cận": item.notes || `Cào thời gian thực từ Google Maps`,
      };
    });

    // 2. Tạo Workbook với SheetJS
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Tự động căn độ rộng cột (Column Auto-Width)
    const colWidths = [
      { wch: 6 },  // STT
      { wch: 35 }, // Tên cơ sở
      { wch: 18 }, // Ngành nghề
      { wch: 18 }, // Số điện thoại
      { wch: 24 }, // Phân loại số
      { wch: 45 }, // Địa chỉ
      { wch: 16 }, // Đánh giá
      { wch: 32 }, // Trạng thái Web
      { wch: 25 }, // Link Web
      { wch: 40 }, // Link Maps
      { wch: 35 }, // Ghi chú
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Khách Hàng Google Maps");

    // Thêm Sheet 2: Kịch Bản Chào Hàng Mẫu cho Telesales
    const scriptRows = [
      {
        "Mục tiêu tiếp cận": "Cơ sở CHƯA CÓ WEBSITE",
        "Kịch bản nhắn Zalo / Gọi điện":
          "Dạ em chào anh/chị bên [Tên Tiệm]! Em thấy tiệm mình ở [Địa Chỉ] đánh giá rất cao và đông khách. Tuy nhiên em thấy trên Google Maps bên mình chưa có trang web để khách xem bảng giá và đặt lịch, dễ bị khách bấm nhầm sang đối thủ gần đó. Em có làm sẵn mẫu web mẫu cho tiệm mình, em gửi anh/chị xem thử miễn phí nhé ạ!",
      },
      {
        "Mục tiêu tiếp cận": "Cơ sở BỊ ĐÁNH GIÁ THẤP (< 4.0 ⭐)",
        "Kịch bản nhắn Zalo / Gọi điện":
          "Dạ em chào anh/chị bên [Tên Tiệm]! Em để ý trên Google Maps tiệm mình đang bị một số đánh giá 1 sao gần đây làm tụt điểm uy tín. Bên em chuyên giải pháp xử lý đánh giá xấu và đẩy 50 review 5 sao thật từ người dùng Google để kéo khách quay lại tiệm mình ạ.",
      },
      {
        "Mục tiêu tiếp cận": "Cơ sở ĐÔNG KHÁCH (CHỐNG BÙNG HẸN)",
        "Kịch bản nhắn Zalo / Gọi điện":
          "Dạ em chào anh/chị bên [Tên Tiệm]! Cuối tuần khách đặt lịch bên mình đông thường hay gặp tình trạng khách đặt xong bận đột xuất không đến làm trống giường/ghế. Bên em có giải pháp quét mã VietQR cọc 50k-100k giữ lịch, tiền về thẳng STK của anh/chị ngay lập tức, loại bỏ 100% bùng hẹn ạ.",
      },
    ];
    const scriptSheet = XLSX.utils.json_to_sheet(scriptRows);
    scriptSheet["!cols"] = [{ wch: 35 }, { wch: 100 }];
    XLSX.utils.book_append_sheet(workbook, scriptSheet, "Kịch Bản Chào Hàng Mẫu");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Trả về file nhị phân đính kèm
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="leads_google_maps_${Date.now()}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error("Export Excel error:", err);
    return NextResponse.json(
      { error: "Lỗi xuất file Excel: " + err.message },
      { status: 500 }
    );
  }
}
