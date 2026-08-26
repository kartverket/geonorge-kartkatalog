"use client";

import dynamic from "next/dynamic";

const HeaderWrapper = dynamic(
    () => import("./OgHeader"),
    { ssr: false }
)

export default HeaderWrapper; 