import { describe, it, expect } from 'vitest';
import { 
  generateSlug, 
  getDemoUrl, 
  renderOutreachMessage, 
  formatZaloPhone, 
  getZaloLink,
  APP1_BASE_URL 
} from '../scripts-engine';
import { computePipelineStats } from '../storage';
import { Lead } from '../types';

describe('Scripts Engine', () => {
  it('generates clean SEO slugs from Vietnamese names', () => {
    expect(generateSlug('An Nhiên Beauty & Spa')).toBe('an-nhien-beauty-spa');
    expect(generateSlug('Nha Khoa Nụ Cười Xinh')).toBe('nha-khoa-nu-cuoi-xinh');
    expect(generateSlug('Hair Salon Tuấn Seoul')).toBe('hair-salon-tuan-seoul');
    expect(generateSlug('Viện Thẩm Mỹ Đẹp 100%')).toBe('vien-tham-my-dep-100');
  });

  it('generates demo URLs targeting App 1', () => {
    expect(getDemoUrl('an-nhien-spa')).toBe(`${APP1_BASE_URL}/an-nhien-spa`);
  });

  it('formats Vietnamese phone numbers for Zalo link correctly', () => {
    expect(formatZaloPhone('0908123456')).toBe('84908123456');
    expect(formatZaloPhone('+84908123456')).toBe('84908123456');
    expect(formatZaloPhone('091.234.5678')).toBe('84912345678');
    expect(getZaloLink('0908123456')).toBe('https://zalo.me/84908123456');
    expect(getZaloLink('+84908401994')).toBe('https://zalo.me/84908401994');
    expect(getZaloLink('0947072357')).toBe('https://zalo.me/84947072357');
  });

  it('validates real scraped leads from Google Maps', () => {
    const realHanoiLead: Lead = {
      id: 'hanoi-1',
      name: '2Vee Hair Station - Cắt Tóc Nam Đẹp Hà Nội',
      category: 'salon',
      phone: '0908401994',
      location: '93 Ng. 171 Đ. Nguyễn Ngọc Vũ, Yên Hòa, Cầu Giấy, Hà Nội',
      managerName: 'Chủ tiệm',
      status: 'new',
      demoSlug: generateSlug('2Vee Hair Station - Cắt Tóc Nam Đẹp Hà Nội'),
      createdAt: '',
      updatedAt: '',
    };
    expect(realHanoiLead.phone).toMatch(/^0[0-9]{9}$/);
    expect(getDemoUrl(realHanoiLead.demoSlug)).toBe(`${APP1_BASE_URL}/2vee-hair-station-cat-toc-nam-dep-ha-noi`);
    expect(getZaloLink(realHanoiLead.phone)).toBe('https://zalo.me/84908401994');

    const realQuangTriLead: Lead = {
      id: 'qt-1',
      name: 'Nha Khoa Nha Nhân',
      category: 'dental',
      phone: '0947072357',
      location: '240 QL9, Phường 1, TP. Đông Hà, Quảng Trị',
      managerName: 'Bác sĩ Nha',
      status: 'new',
      demoSlug: generateSlug('Nha Khoa Nha Nhân'),
      createdAt: '',
      updatedAt: '',
    };
    expect(realQuangTriLead.phone).toMatch(/^0[0-9]{9}$/);
    expect(getDemoUrl(realQuangTriLead.demoSlug)).toBe(`${APP1_BASE_URL}/nha-khoa-nha-nhan`);
    expect(getZaloLink(realQuangTriLead.phone)).toBe('https://zalo.me/84947072357');
  });

  it('renders customized outreach script with lead variables', () => {
    const mockLead: Lead = {
      id: 'test-1',
      name: 'Spa Sen Vàng',
      category: 'spa',
      phone: '0901234567',
      location: 'Quận 1',
      managerName: 'Chị Mai',
      status: 'new',
      demoSlug: 'spa-sen-vang',
      createdAt: '',
      updatedAt: '',
    };

    const message = renderOutreachMessage(mockLead);
    expect(message).toContain('Chị Mai');
    expect(message).toContain('Spa Sen Vàng');
    expect(message).toContain(`${APP1_BASE_URL}/spa-sen-vang`);
    expect(message).toContain('quét mã VietQR đặt cọc');
  });
});

describe('Pipeline Stats Calculation', () => {
  it('computes pipeline conversion and counts accurately', () => {
    const mockLeads: Lead[] = [
      { id: '1', name: 'A', category: 'spa', phone: '1', location: '', status: 'new', demoSlug: 'a', createdAt: '', updatedAt: '' },
      { id: '2', name: 'B', category: 'spa', phone: '2', location: '', status: 'contacted', demoSlug: 'b', createdAt: '', updatedAt: '' },
      { id: '3', name: 'C', category: 'spa', phone: '3', location: '', status: 'viewed_demo', demoSlug: 'c', createdAt: '', updatedAt: '' },
      { id: '4', name: 'D', category: 'spa', phone: '4', location: '', status: 'negotiating', demoSlug: 'd', createdAt: '', updatedAt: '' },
      { id: '5', name: 'E', category: 'spa', phone: '5', location: '', status: 'won', demoSlug: 'e', createdAt: '', updatedAt: '' },
    ];

    const stats = computePipelineStats(mockLeads);
    expect(stats.total).toBe(5);
    expect(stats.newLeads).toBe(1);
    expect(stats.contacted).toBe(1);
    expect(stats.viewedDemo).toBe(1);
    expect(stats.negotiating).toBe(1);
    expect(stats.won).toBe(1);
    expect(stats.conversionRate).toBe(20); // 1 / 5 = 20%
  });
});
