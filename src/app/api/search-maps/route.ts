import { NextRequest, NextResponse } from 'next/server';
import { GooglePlaceResult, LeadCategory } from '@/lib/types';

function inferCategoryFromTypes(types: string[] = [], name: string = ''): LeadCategory {
  const lowerName = name.toLowerCase();
  const lowerTypes = types.map((t) => t.toLowerCase());

  if (
    lowerName.includes('spa') ||
    lowerName.includes('thẩm mỹ') ||
    lowerName.includes('beauty') ||
    lowerName.includes('massage') ||
    lowerTypes.includes('spa') ||
    lowerTypes.includes('beauty_salon')
  ) {
    return 'spa';
  }

  if (
    lowerName.includes('nha khoa') ||
    lowerName.includes('răng') ||
    lowerName.includes('dental') ||
    lowerTypes.includes('dentist')
  ) {
    return 'dental';
  }

  if (
    lowerName.includes('salon') ||
    lowerName.includes('tóc') ||
    lowerName.includes('hair') ||
    lowerName.includes('barber') ||
    lowerName.includes('nail') ||
    lowerTypes.includes('hair_care')
  ) {
    return 'salon';
  }

  if (
    lowerName.includes('sân') ||
    lowerName.includes('pickleball') ||
    lowerName.includes('tennis') ||
    lowerName.includes('cầu lông') ||
    lowerName.includes('bóng đá') ||
    lowerTypes.includes('stadium') ||
    lowerTypes.includes('gym')
  ) {
    return 'sports';
  }

  if (
    lowerName.includes('phòng khám') ||
    lowerName.includes('bác sĩ') ||
    lowerName.includes('clinic') ||
    lowerName.includes('y tế') ||
    lowerTypes.includes('doctor') ||
    lowerTypes.includes('hospital')
  ) {
    return 'clinic';
  }

  return 'other';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || '').trim();
    const apiKey = (body.apiKey || process.env.GOOGLE_MAPS_API_KEY || '').trim();

    if (!query) {
      return NextResponse.json({ error: 'Vui lòng nhập từ khóa tìm kiếm (VD: Spa Quận 1, Nha khoa Cầu Giấy)' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({
        error: 'Chưa có Google Maps API Key.',
        code: 'NO_API_KEY',
        message: 'Bạn có thể nhập API Key của mình hoặc sử dụng tính năng "Nhập nhanh từ Google Maps" không cần API Key.',
      }, { status: 400 });
    }

    // Call Google Places API (New)
    const googleRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.googleMapsUri,places.types',
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: 'vi',
      }),
    });

    if (!googleRes.ok) {
      const errData = await googleRes.json().catch(() => ({}));
      return NextResponse.json({
        error: 'Lỗi từ Google Places API: ' + (errData.error?.message || googleRes.statusText),
      }, { status: googleRes.status });
    }

    const data = await googleRes.json();
    const rawPlaces = data.places || [];

    const results: GooglePlaceResult[] = rawPlaces.map((p: any) => {
      const name = p.displayName?.text || 'Không rõ tên';
      const category = inferCategoryFromTypes(p.types, name);

      return {
        placeId: p.id,
        name,
        address: p.formattedAddress || 'Chưa cập nhật địa chỉ',
        phone: p.nationalPhoneNumber || '',
        rating: p.rating,
        reviewCount: p.userRatingCount,
        googleMapsUri: p.googleMapsUri || '',
        types: p.types,
        category,
      };
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      places: results,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Lỗi máy chủ khi tìm kiếm: ' + err.message }, { status: 500 });
  }
}
