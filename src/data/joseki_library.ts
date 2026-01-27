
export interface JosekiPattern {
    id: string;
    title: string;
    difficulty: number;
    sgf: string;
    description: string;
    usage: string;
}

export const josekiLibrary: JosekiPattern[] = [
    // ============================================
    // 实战验证 (Verified Real Game)
    // ============================================
    {
        id: 'star-33-kejie',
        title: '星位点三三·柯洁实战 (大飞滑)',
        difficulty: 2,
        description: '取自春兰杯柯洁(黑)vs芈昱廷。关键点：黑棋长(C16)后，不爬(C15)而是直接大飞滑(B14)，追求更高效率。',
        usage: '当想保留角部弹性，且不愿意帮白棋撞厚外势时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[Mi Yuting]PB[Ke Jie]AW[dd]
(;B[cc]C[实战：点三三。]
;W[dc]C[实战：挡。]
;B[cd]C[实战：长。]
;W[de]C[实战：长。]
;B[bf]C[实战：大飞滑！(B14)。柯洁略去了C15爬的交换，保留余味。]
;W[bd]C[后续：白棋常见应手。]
;B[bc]
;W[ce]
;B[be]
;W[cg]C[后续：定型。]))`
    },

    // ============================================
    // 用户精选 (User Contributed)
    // ============================================
    {
        id: 'komoku-pincer-sacrifice-user',
        title: '【用户推荐】小目一间低夹·AI改良 (左下)',
        difficulty: 3,
        description: '白棋被低夹后，选择弃子转身。黑11手粘(O16/类似位置)是AI改良手段，比旧定式更厚。',
        usage: '经典弃子战术，双方两分。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]
AB[dq]
(;W[fq]C[白棋挂角。]
;B[hq]C[黑棋一间低夹。]
;W[fo]C[白棋飞（或大飞）。]
;B[dn]
;W[dr]C[白棋托（寻求弃子）。]
;B[er]
;W[cr]
;B[eq]
;W[bo]
;B[bn]
;W[co]
;B[cn]
;W[cq]
;B[ep]C[黑11粘！厚实冷却。]))`
    }
];
