import { Lead, LeadCategory, OutreachScript } from './types';

export const APP1_BASE_URL = 'https://vietqrbooking.com';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function getDemoUrl(slug: string): string {
  return `${APP1_BASE_URL}/${slug}`;
}

export function generateStoreDemoUrl(lead: Partial<Lead>): string {
  const slug = lead.demoSlug || generateSlug(lead.name || 'tiem-dich-vu');
  const params = new URLSearchParams({
    name: lead.name || '',
    phone: lead.phone || '',
    addr: lead.location || '',
    cat: lead.category || '',
  });
  return `${APP1_BASE_URL}/${slug}?${params.toString()}`;
}

export const OUTREACH_SCRIPTS: Record<LeadCategory, OutreachScript> = {
  spa: {
    id: 'script-spa',
    category: 'spa',
    title: 'Kịch bản Spa / Thẩm mỹ viện (Chống bùng cọc)',
    template: `Dạ em chào {manager}! Em thấy tiệm {name} của mình dịch vụ rất chuyên nghiệp và lượng khách đặt chăm sóc da cuối tuần khá đông.

Em để ý các tiệm spa lớn hiện nay thường bị tình trạng khách nhắn đặt lịch xong tới giờ bận đột xuất hoặc quên không đến, làm trống giường và thợ phải ngồi chờ.

Bên em vừa dựng sẵn cho {name} một trang web đặt lịch tự động có tính năng quét mã VietQR đặt cọc 50k - 100k để giữ chỗ, tiền về thẳng tài khoản ngân hàng của chị ngay lập tức.

Em có làm sẵn bản xem thử mang đúng tên tiệm mình ở đây ạ:
👉 {demoUrl}

Chị xem qua 1 phút nếu thấy tiện cho tiệm mình thì em hỗ trợ bên mình dùng thử miễn phí nhé ạ!`,
  },
  dental: {
    id: 'script-dental',
    category: 'dental',
    title: 'Kịch bản Nha khoa / Phòng khám (Giữ giờ hẹn bác sĩ)',
    template: `Em chào {manager} ạ! Em thấy phòng khám {name} có uy tín rất cao trong khu vực.

Tuy nhiên với các ca cạo vôi, tẩy trắng răng hay chỉnh nha, việc khách delay 30-45 phút hoặc bỏ hẹn giờ chót sẽ gây xáo trộn lịch của bác sĩ và lãng phí ghế nha khoa.

Bên em có giải pháp web đặt lịch thông minh tích hợp VietQR: khách chọn khung giờ chính xác và cọc giữ chỗ 50k - 100k tự động.

Em đã tạo sẵn bản trải nghiệm thực tế cho phòng khám {name} tại đây:
👉 {demoUrl}

Bác sĩ bấm vào xem thử nhé, bên em đang có chính sách hỗ trợ kết nối tài khoản ngân hàng miễn phí tuần này ạ!`,
  },
  salon: {
    id: 'script-salon',
    category: 'salon',
    title: 'Kịch bản Hair Salon / Nail Bar (Tránh quá tải & ảo)',
    template: `Chào {manager}! Em thấy tiệm tóc {name} làm mẫu uốn nhuộm rất đẹp và đông khách.

Mỗi dịp cuối tuần khách đặt qua tin nhắn nhiều khi thợ không kịp nhớ lịch, hoặc khách đặt làm combo 3-4 tiếng rồi hủy làm tiệm từ chối mất khách vãng lai.

Bên em có hệ thống đặt lịch tự động qua VietQR: khách tự chọn dịch vụ, chọn thợ và cọc 50k để chắc chắn đến, giảm ngay 95% khách bùng hẹn.

Em đã làm sẵn web demo cho tiệm {name} ở đây:
👉 {demoUrl}

Anh/chị vào xem thử trên điện thoại nhé, giao diện cực kỳ mượt mà và dễ dùng ạ!`,
  },
  sports: {
    id: 'script-sports',
    category: 'sports',
    title: 'Kịch bản Sân Pickleball / Cầu lông / Sân bóng',
    template: `Chào {manager} sân {name}!

Vấn đề đau đầu nhất của các chủ sân Pickleball/Cầu lông hiện nay là khách gọi giữ sân giờ vàng 17h - 21h nhưng gần đến giờ lại báo bận, làm sân trống không kịp cho nhóm khác thuê.

Bên em có trang web đặt sân nhanh: người chơi tự chọn khung giờ còn trống và quét mã VietQR cọc tiền trước thì hệ thống mới khóa sân. Tiền cọc vào thẳng tài khoản của anh.

Em làm sẵn web demo cho sân {name} tại:
👉 {demoUrl}

Anh bấm vào thử đặt sân trải nghiệm xem sao nhé!`,
  },
  clinic: {
    id: 'script-clinic',
    category: 'clinic',
    title: 'Kịch bản Phòng khám đa khoa / Chuyên khoa',
    template: `Kính chào {manager} - Phòng khám {name}!

Để giảm thiểu tình trạng bệnh nhân chờ đợi dồn ứ giờ cao điểm hoặc đăng ký khám nhưng không đến, bên em cung cấp giải pháp đặt hẹn khám bệnh tự động qua mã VietQR.

Bệnh nhân được chọn khung giờ trống của bác sĩ và đóng tạm ứng/cọc khám nhanh qua app ngân hàng, hệ thống tự động gửi tin nhắn nhắc hẹn.

Bản mẫu demo dành riêng cho {name}:
👉 {demoUrl}

Xin phép gửi {manager} tham khảo ạ!`,
  },
  restaurant: {
    id: 'script-restaurant',
    category: 'restaurant',
    title: 'Kịch bản Nhà hàng / Quán ăn (Giữ bàn giờ cao điểm)',
    template: `Chào {manager} nhà hàng {name}!

Vào các dịp cuối tuần hoặc lễ tết, tình trạng khách đặt bàn tiệc đông người nhưng phút chót hủy bàn hoặc không tới khiến nhà hàng mất doanh thu và bỏ lỡ nhiều đoàn khách khác.

Bên em cung cấp giải pháp web đặt bàn nhanh kèm tính năng quét mã VietQR đặt cọc giữ bàn tự động. Tiền cọc chuyển thẳng vào tài khoản của nhà hàng.

Em đã làm sẵn web demo cho {name} tại:
👉 {demoUrl}

Anh/chị xem qua thử trên điện thoại xem có phù hợp với quán mình không nhé!`,
  },
  hotel: {
    id: 'script-hotel',
    category: 'hotel',
    title: 'Kịch bản Khách sạn / Homestay (Cọc phòng trực tiếp)',
    template: `Dạ em chào {manager} {name}!

Để giảm bớt hoa hồng 15-20% phải trả cho các kênh OTA (Booking, Agoda) và tránh khách book phòng ảo, bên em cung cấp giải pháp đặt phòng trực tiếp qua web riêng.

Khách chọn ngày check-in, check-out và quét mã VietQR thanh toán hoặc cọc trước ngay trên điện thoại, tiền về tài khoản ngân hàng của cơ sở ngay.

Em có tạo sẵn bản demo cho {name} ở đây ạ:
👉 {demoUrl}

Anh/chị bấm vào xem thử nhé!`,
  },
  other: {
    id: 'script-other',
    category: 'other',
    title: 'Kịch bản Chung (Bán hàng chung mọi dịch vụ)',
    template: `Chào {manager} cơ sở {name}!

Bên em cung cấp giải pháp Website đặt lịch hẹn tự động chống bùng cọc qua mã VietQR ngân hàng.

Giúp tiệm tự động hóa khâu chốt lịch, thu tiền cọc trước và gửi thông báo nhắc khách đúng giờ.

Em đã chuẩn bị sẵn trang demo riêng cho tiệm mình ở đây:
👉 {demoUrl}

Anh/chị mở điện thoại xem thử trải nghiệm thực tế nhé!`,
  },
};

export function renderOutreachMessage(lead: Lead): string {
  const scriptObj = OUTREACH_SCRIPTS[lead.category] || OUTREACH_SCRIPTS.other;
  const manager = lead.managerName || 'anh/chị';
  const demoUrl = lead.demoUrl || generateStoreDemoUrl(lead);

  return scriptObj.template
    .replace(/\{manager\}/g, manager)
    .replace(/\{name\}/g, lead.name)
    .replace(/\{demoUrl\}/g, demoUrl);
}

export function formatZaloPhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    return '84' + cleaned.slice(1);
  }
  return cleaned;
}

export function getZaloLink(phone: string): string {
  const formatted = formatZaloPhone(phone);
  return `https://zalo.me/${formatted}`;
}
