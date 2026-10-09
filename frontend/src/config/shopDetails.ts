export interface ShopDetails {
    businessName: string;
    address: string;
    phoneNumber: string;
    ownerName: string;
    email: string;
    description: string;
    gstin: string;
    state: string;
}

function environmentValue(
    value: string | undefined,
    fallback = ""
): string {
    return value?.trim() || fallback;
}

export const shopDetails: ShopDetails = {
    businessName: environmentValue(
        import.meta.env.VITE_SHOP_NAME,
        "TYRE SHOPPEE"
    ),

    address: environmentValue(
        import.meta.env.VITE_SHOP_ADDRESS,
        "Opp. Sunrise Hospital, Koshimukunnu, Kizhakkumkara, Kanhangad - 671531"
    ),

    phoneNumber: environmentValue(
        import.meta.env.VITE_SHOP_PHONE,
        "9895449593 / 9495208597"
    ),

    ownerName: environmentValue(
        import.meta.env.VITE_SHOP_OWNER,
        "Namadev Shenoy"
    ),

    email: environmentValue(
        import.meta.env.VITE_SHOP_EMAIL,
        "namadev.shenoy@gmail.com"
    ),

    description: environmentValue(
        import.meta.env.VITE_SHOP_DESCRIPTION,
        "MRF Tyres and Service Franchise"
    ),

    gstin: environmentValue(
        import.meta.env.VITE_SHOP_GSTIN,
        "32AADFT9668G1ZV"
    ),

    state: environmentValue(
        import.meta.env.VITE_SHOP_STATE,
        "Kerala (State Code 32)"
    )
};
