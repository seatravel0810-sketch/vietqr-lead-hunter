import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { db } from '@/db';
import { leads as leadsTable } from '@/db/schema';
import { ilike, or, and, desc, sql } from 'drizzle-orm';

const execAsync = promisify(exec);

function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

// Hàm lưu trữ an toàn vào Supabase PostgreSQL
async function saveLeadsToSupabase(items: any[]) {
  try {
    for (const item of items) {
      if (!item.name) continue;
      const cleanPhone = (item.phone || '').replace(/[^0-9+]/g, '');
      const isMobile = /^(0|\+84)(9|8|7|3|5)[0-9]{8}$/.test(cleanPhone);
      const placeId = item.googleMapsUrl || `place-${item.demoSlug || item.name}`;

      await db
        .insert(leadsTable)
        .values({
          placeId,
          name: item.name,
          category: item.category || 'other',
          categoryLabel: item.categoryLabel || item.category || 'Dịch vụ',
          phone: item.phone || 'Chưa có SĐT',
          phoneStandard: cleanPhone,
          phoneType: isMobile ? 'mobile' : cleanPhone ? 'landline' : 'none',
          address: item.location || 'Việt Nam',
          city: item.location || 'Việt Nam',
          googleRating: item.rating ? String(item.rating) : '5.0',
          reviewsCount: Number(item.reviewsCount) || 10,
          googleMapsUrl: item.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(item.name)}`,
          website: item.website || null,
          hasWebsite: Boolean(item.website),
          rawData: item,
        })
        .onConflictDoUpdate({
          target: leadsTable.placeId,
          set: {
            phone: item.phone || 'Chưa có SĐT',
            phoneType: isMobile ? 'mobile' : cleanPhone ? 'landline' : 'none',
            address: item.location || 'Việt Nam',
            googleRating: item.rating ? String(item.rating) : '5.0',
            lastCrawledAt: new Date(),
          },
        });
    }
    console.log(`[Database] Đã đồng bộ an toàn ${items.length} cơ sở vào Supabase PostgreSQL.`);
  } catch (err: any) {
    console.warn('[Database] Cảnh báo lưu Supabase:', err.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || '').trim();
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50);

    if (!query) {
      return NextResponse.json(
        { error: 'Vui lòng nhập từ khóa tìm kiếm (VD: Hớt tóc Hà Nội, Nha khoa Quảng Trị, Spa Vĩnh Yên)' },
        { status: 400 }
      );
    }

    // 1. Ưu tiên số 1: Chạy Playwright crawler cào trực tiếp từ Google Maps nếu có môi trường Python
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'google_maps_crawler.py');
    const isLocalMachine = fs.existsSync(scriptPath);
    const tempOutputFile = path.resolve(
      process.cwd(),
      'scripts',
      `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 4)}.json`
    );

    let liveLeads: any[] | null = null;

    if (isLocalMachine) {
      try {
        const command = `python "${scriptPath}" --query "${query}" --limit ${limit} --output "${tempOutputFile}"`;
        console.log('[Crawler API] Chạy cỗ máy cào Google Maps Playwright:', command);
        await execAsync(command, { timeout: 180000 });

        if (fs.existsSync(tempOutputFile)) {
          const fileContent = fs.readFileSync(tempOutputFile, 'utf-8');
          const parsed = JSON.parse(fileContent);
          if (Array.isArray(parsed) && parsed.length > 0) {
            liveLeads = parsed;
          }
          try {
            fs.unlinkSync(tempOutputFile);
          } catch {}
        }
      } catch (err: any) {
        console.warn('[Crawler API] Lỗi cào trực tiếp qua Python Playwright:', err.message);
      }
    }

    if (liveLeads && liveLeads.length > 0) {
      // Tự động lưu vào Supabase chạy nền không làm chậm phản hồi
      saveLeadsToSupabase(liveLeads).catch(() => {});

      return NextResponse.json({
        success: true,
        source: 'live_google_maps_crawler',
        query,
        count: liveLeads.length,
        leads: liveLeads,
      });
    }

    // 2. Ưu tiên số 2: Truy vấn kho dữ liệu Supabase PostgreSQL với Bảo Toàn Tính Toàn Vẹn Địa Lý (Strict Geo-Integrity)
    try {
      const lowerQuery = query.toLowerCase().trim();
      const CATEGORY_KEYWORDS = [
        'thẩm mỹ viện', 'tham my vien', 'chăm sóc da', 'triệt lông', 'dưỡng sinh', 'duong sinh', 'massage', 'thẩm mỹ', 'tham my', 'spa',
        'nha khoa', 'răng hàm mặt', 'rang ham mat', 'phòng khám răng', 'bọc răng', 'niềng răng', 'răng', 'rang', 'dental',
        'cắt tóc', 'cat toc', 'hớt tóc', 'hot toc', 'tiệm tóc', 'tiem toc', 'quán cắt tóc', 'salon tóc', 'salon', 'barber', 'tóc', 'toc', 'hair', 'nail', 'móng', 'gội đầu', 'goi dau', 'cắt', 'cat', 'hớt', 'hot',
        'sân pickleball', 'san pickleball', 'pickleball', 'sân cầu lông', 'san cau long', 'cầu lông', 'cau long', 'sân tennis', 'tennis', 'sân bóng', 'san bong', 'sân', 'san',
        'phòng khám', 'phong kham', 'bác sĩ', 'bac si', 'bệnh viện', 'benh vien', 'clinic', 'y tế', 'y te',
        'nhà hàng', 'nha hang', 'quán ăn', 'quan an', 'quán cafe', 'cà phê', 'trà sữa',
        'khách sạn', 'khach san', 'homestay', 'nhà nghỉ', 'nha nghi', 'hotel'
      ];

      // Nhận diện category nếu có
      let detectedCategory: string | null = null;
      for (const catKey of CATEGORY_KEYWORDS) {
        if (lowerQuery.includes(catKey)) {
          if (['spa', 'thẩm mỹ', 'tham my', 'massage', 'dưỡng sinh', 'duong sinh', 'chăm sóc da'].some(k => catKey.includes(k))) detectedCategory = 'spa';
          else if (['nha khoa', 'răng', 'rang', 'dental'].some(k => catKey.includes(k))) detectedCategory = 'dental';
          else if (['cắt', 'cat', 'hớt', 'hot', 'salon', 'tóc', 'toc', 'hair', 'barber', 'nail', 'gội'].some(k => catKey.includes(k))) detectedCategory = 'salon';
          else if (['pickleball', 'sân', 'san', 'cầu lông', 'cau long', 'tennis'].some(k => catKey.includes(k))) detectedCategory = 'sports';
          else if (['phòng khám', 'phong kham', 'bác sĩ', 'bac si', 'clinic', 'bệnh viện'].some(k => catKey.includes(k))) detectedCategory = 'clinic';
          else if (['nhà hàng', 'nha hang', 'quán ăn', 'quan an', 'cafe', 'cà phê'].some(k => catKey.includes(k))) detectedCategory = 'restaurant';
          else if (['khách sạn', 'khach san', 'hotel', 'homestay', 'nhà nghỉ'].some(k => catKey.includes(k))) detectedCategory = 'hotel';
          break;
        }
      }

      if (!detectedCategory && body.category && body.category !== 'all') {
        detectedCategory = body.category;
      }

      // Tách phần địa danh (loại bỏ từ khóa ngành nghề - ưu tiên từ dài trước)
      let locationPart = lowerQuery;
      const sortedCatKeywords = [...CATEGORY_KEYWORDS].sort((a, b) => b.length - a.length);
      for (const catKey of sortedCatKeywords) {
        locationPart = locationPart.replace(new RegExp(catKey, 'gi'), ' ');
      }
      const locationTokens = locationPart.trim().split(/\s+/).filter((w: string) => w.length > 1);

      const conditions: any[] = [];

      // A. Lọc theo Ngành nghề:
      if (detectedCategory) {
        conditions.push(
          or(
            ilike(leadsTable.category, `%${detectedCategory}%`),
            ilike(leadsTable.categoryLabel, `%${detectedCategory}%`),
            ilike(leadsTable.name, `%${detectedCategory}%`)
          )
        );
      }

      // B. Lọc theo Địa phương (BẮT BUỘC mỗi token địa danh phải khớp trong địa chỉ hoặc thành phố, hỗ trợ cả có dấu và không dấu):
      if (locationTokens.length > 0) {
        for (const tok of locationTokens) {
          if (tok.length <= 3) {
            const regexPat = `\\m${tok}\\M`;
            conditions.push(
              or(
                sql`unaccent(${leadsTable.address}) ~* unaccent(${regexPat})`,
                sql`unaccent(${leadsTable.city}) ~* unaccent(${regexPat})`,
                sql`unaccent(${leadsTable.name}) ~* unaccent(${regexPat})`
              )
            );
          } else {
            const pat = `%${tok}%`;
            conditions.push(
              or(
                sql`unaccent(${leadsTable.address}) ILIKE unaccent(${pat})`,
                sql`unaccent(${leadsTable.city}) ILIKE unaccent(${pat})`,
                sql`unaccent(${leadsTable.name}) ILIKE unaccent(${pat})`
              )
            );
          }
        }
      }

      let dbResults: any[] = [];

      if (conditions.length > 0) {
        dbResults = await db
          .select()
          .from(leadsTable)
          .where(and(...conditions))
          .orderBy(desc(leadsTable.googleRating))
          .limit(limit);
      } else {
        const words = query.trim().split(/\s+/).filter((w: string) => w.length > 1);
        if (words.length > 0) {
          const generalConditions = words.map((w: string) => {
            const pat = `%${w}%`;
            return or(
              sql`unaccent(${leadsTable.name}) ILIKE unaccent(${pat})`,
              sql`unaccent(${leadsTable.address}) ILIKE unaccent(${pat})`,
              sql`unaccent(${leadsTable.city}) ILIKE unaccent(${pat})`
            );
          });
          dbResults = await db
            .select()
            .from(leadsTable)
            .where(and(...generalConditions))
            .orderBy(desc(leadsTable.googleRating))
            .limit(limit);
        }
      }

      // Lọc bảo toàn địa lý thông minh (Smart Geo-Integrity):
      // Nếu người dùng tìm tỉnh/thành phố cụ thể, loại bỏ các cơ sở thuộc tỉnh/thành phố khác (ví dụ: tìm Yên Bái nhưng trùng tên phố ở Hà Nội)
      const SPECIFIC_PROVINCES = [
        { key: 'yên bái', exclude: ['hà nội', 'hồ chí minh'] },
        { key: 'đà nẵng', exclude: ['hà nội', 'hồ chí minh'] },
        { key: 'hải phòng', exclude: ['hà nội', 'hồ chí minh'] },
        { key: 'vĩnh yên', exclude: ['hà nội', 'hồ chí minh'] },
        { key: 'vĩnh phúc', exclude: ['hà nội', 'hồ chí minh'] },
        { key: 'cần thơ', exclude: ['hà nội', 'hồ chí minh'] },
        { key: 'quảng ninh', exclude: ['hà nội', 'hồ chí minh'] },
        { key: 'nha trang', exclude: ['hà nội', 'hồ chí minh'] },
        { key: 'huế', exclude: ['hà nội', 'hồ chí minh'] },
      ];

      for (const prov of SPECIFIC_PROVINCES) {
        if (locationPart.includes(prov.key)) {
          dbResults = dbResults.filter((r) => {
            const rAddr = (r.address || '').toLowerCase();
            const rCity = (r.city || '').toLowerCase();
            const matchesProv = rCity.includes(prov.key) || rAddr.includes(prov.key);
            const isExcluded = prov.exclude.some((ex) => rAddr.includes(ex) || rCity.includes(ex));
            return matchesProv && !isExcluded;
          });
          break;
        }
      }

      if (dbResults && dbResults.length > 0) {
        const formatted = dbResults.map((row) => ({
          name: row.name,
          category: row.category,
          phone: row.phone,
          location: row.address,
          managerName: 'Chủ tiệm',
          status: 'new',
          demoSlug: row.placeId,
          googleMapsUrl: row.googleMapsUrl,
          rating: Number(row.googleRating) || 5.0,
          website: row.website,
          notes: 'Dữ liệu thực từ Google Maps đã lưu trữ Supabase',
        }));

        return NextResponse.json({
          success: true,
          source: 'supabase_database_cache',
          query,
          count: formatted.length,
          leads: formatted,
        });
      }
    } catch (dbErr: any) {
      console.warn('[Crawler API] Lỗi truy vấn Supabase:', dbErr.message);
    }

    // 3. Xử lý trường hợp không có kết quả: Thông báo trung thực, tuyệt đối không lấy bừa địa phương khác
    return NextResponse.json(
      {
        success: false,
        error: `Hiện tại chưa có dữ liệu cơ sở cho "${query}". Bạn hãy thử các khu vực đã có sẵn dữ liệu đầy đủ (như "Spa Hoàn Kiếm", "Spa Cầu Giấy Hà Nội", "Nha khoa Quận 1 TP.HCM", "Hair Salon Đà Nẵng", "Spa Yên Bái") hoặc khởi chạy cào thêm khu vực này.`,
        leads: [],
      },
      { status: 404 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi server: ' + err.message }, { status: 500 });
  }
}
