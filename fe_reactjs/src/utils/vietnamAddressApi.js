const BASE_URL = 'https://provinces.open-api.vn/api';

const fetchJson = async (path) => {
    const response = await fetch(`${BASE_URL}${path}`);
    if (!response.ok) {
        throw new Error('Không thể tải dữ liệu địa chỉ');
    }
    return response.json();
};

export const fetchProvinces = async () => {
    return fetchJson('/p/');
};

export const fetchDistrictsByProvinceCode = async (provinceCode) => {
    if (!provinceCode) return [];
    const data = await fetchJson(`/p/${provinceCode}?depth=2`);
    return data.districts || [];
};

export const fetchWardsByDistrictCode = async (districtCode) => {
    if (!districtCode) return [];
    const data = await fetchJson(`/d/${districtCode}?depth=2`);
    return data.wards || [];
};

export const findAddressCodes = async ({ province, district, ward }, provinceList = []) => {
    const provinces = provinceList.length > 0 ? provinceList : await fetchProvinces();
    const matchedProvince = provinces.find(item => item.name === province);

    if (!matchedProvince) {
        return { provinces, districts: [], wards: [], provinceCode: '', districtCode: '', wardCode: '' };
    }

    const districts = await fetchDistrictsByProvinceCode(matchedProvince.code);
    const matchedDistrict = districts.find(item => item.name === district);

    if (!matchedDistrict) {
        return { provinces, districts, wards: [], provinceCode: String(matchedProvince.code), districtCode: '', wardCode: '' };
    }

    const wards = await fetchWardsByDistrictCode(matchedDistrict.code);
    const matchedWard = wards.find(item => item.name === ward);

    return {
        provinces,
        districts,
        wards,
        provinceCode: String(matchedProvince.code),
        districtCode: String(matchedDistrict.code),
        wardCode: matchedWard ? String(matchedWard.code) : ''
    };
};
