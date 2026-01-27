
export interface JosekiPattern {
    id: string;
    title: string;
    difficulty: number;
    sgf: string;
    description: string;
    usage: string;
}

export const josekiLibrary: JosekiPattern[] = [
    // --- Star Point (8) ---
    {
        id: 'star-33',
        title: '星位点三三·柯洁实战型 (大飞滑)',
        difficulty: 1,
        description: '取自第15届春兰杯 (柯洁执黑) 实战。黑棋点三三后选择大飞滑向边路，比单纯爬更具弹性。',
        usage: '职业高手首选。快速安定，保留角部余味。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dd]
(;B[cc]C[正解：点三三 (柯洁实战)。]
;W[dc]C[正解：白棋挡。]
;B[cd]C[正解：长。]
;W[de]C[正解：长。]
;B[bf]C[正解：大飞滑 (Keima Slide)。比普通飞(B15)更远，效率更高。]
;W[bd]C[正解：白棋阻渡（可选）。]
;B[bc]
;W[ce]
;B[be]C[正解：局部定型。]))`
    },
    {
        id: 'star-33-knight',
        title: '星位点三三·飞压型 (外势主导)',
        difficulty: 3,
        description: '白棋选择飞压，意在张起模样。这是 AI 时代构建大模样的关键手段。',
        usage: '当白棋希望经营中腹模样，或者配合两翼张开时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dp]
(;B[cq]C[正解：点三三。]
;W[cp]
;B[dq]
;W[ep]
;B[eq]
;W[fp]C[正解：飞压(F4)，比长(F3)更注重外势。]
;B[fq]
;W[gp]
;B[gq]
;W[hp]
;B[hq]C[正解：黑棋实地很大，白棋外势壮观。]))`
    },
    {
        id: 'star-33-double-hane',
        title: '星位点三三·连扳 (战斗型) 🔥',
        difficulty: 4,
        description: '点三三最激烈的后续变化之一。黑棋通过连扳寻求转身或转换。',
        usage: '当黑棋不满足于单纯做活，希望在局部制造复杂战斗或劫争时使用。5段必修。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dp]
(;B[cq]
;W[cp]
;B[dq]
;W[ep]
;B[eq]
;W[fq]
;B[fr]
;W[gr]
;B[er]
;W[gq]
;B[cp]C[正解：连扳！如果不补断而选择战斗。]
;W[bo]
;B[bq]
;W[co]
;B[ds]C[正解：黑棋先手做活，保留后续余味。]))`
    },
    {
        id: 'star-low-approach',
        title: '星位小飞挂·小飞应 (稳健型)',
        difficulty: 2,
        description: '白棋小飞应是应对挂角最稳健的下法之一，但不防点三三。',
        usage: '当白棋注重这一侧边的发展，且能接受角地被黑棋点三三掏掉时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[pd]
(;B[qf]C[正解：小飞挂。]
;W[nc]C[此为小飞应。角上点三三仍有余味。]
;B[qd]
;W[qc]
;B[rc]
;W[qe]
;B[rd]
;W[re]
;B[qb]
;W[pf]C[正解：黑棋实利极大，白棋取外势。]))`
    },
    {
        id: 'star-kick',
        title: '星位小飞挂·尖顶定式 (攻击型)',
        difficulty: 3,
        description: '白棋尖顶攻击，索取实地并迫使黑棋立二拆三，是现代定式三大支柱之一。',
        usage: '当白棋希望先手拿角，并对黑棋展开攻击时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dp]
(;B[cn]C[正解：小飞挂。]
;W[co]C[正解：尖顶 (Kick)。]
;B[dn]
;W[fp]
;B[dl]
;W[ck]C[正解：白棋实地化，逼迫黑棋出头。]
;B[cl]
;W[bk]
;B[dj]C[正解：双方定型。]))`
    },
    {
        id: 'star-pincer',
        title: '星位小飞挂·一间夹击 (战斗型)',
        difficulty: 4,
        description: '激烈的战斗定式。业余 5 段必须具备战斗力。',
        usage: '当白棋周围配置较强，希望主动挑起战斗时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dp]
(;B[cn]
;W[cl]C[正解：一间夹击。]
;B[cq]
;W[dq]
;B[cp]
;W[do]
;B[bn]
;W[co]
;B[bo]
;W[dn]C[正解：黑取角，白取外势。]))`
    },
    {
        id: 'star-high-approach',
        title: '星位一间高挂 (取势)',
        difficulty: 3,
        description: '高挂常用于破坏白棋模样。',
        usage: '当想要经营外势，或者防止对方围成大模样时推荐。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dd]
(;B[fd]C[正解：高挂。]
;W[fc]
;B[bd]
;W[cc]
;B[ci]C[正解：双方和平分配合理。]))`
    },
    {
        id: 'star-high-tsuke',
        title: '星位高挂·托退定式 (简明)',
        difficulty: 2,
        description: '面对高挂，托退是最简明的定型手段。',
        usage: '当不希望局面复杂化，快速安定时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dp]
(;B[fp]C[正解：高挂。]
;W[fo]C[正解：托 (Tsuke)。]
;B[go]
;W[eo]
;B[gn]
;W[cq]
;B[gq]C[正解：经典的托退定型。]))`
    },

    // --- Komoku (7) ---
    {
        id: 'komoku-kosumi',
        title: '小目小飞挂·秀策尖 (AI 推荐) 🔥',
        difficulty: 2,
        description: '古老的"秀策尖"，被 AI 证明是胜率最高的应手之一。厚实无弱点。',
        usage: '当希望稳健防守，不给对手借用，且蓄力攻击时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qp]
(;B[oq]C[正解：小飞挂。]
;W[po]C[正解：秀策尖 (Kosumi)。Q5。]
;B[pp]
;W[qo]
;B[qq]
;W[rq]
;B[qr]
;W[rr]C[正解：白棋极厚，黑棋虽活但被压低。]))`
    },
    {
        id: 'komoku-iron-pillar',
        title: '小目小飞挂·铁柱 (AI 铁壁)',
        difficulty: 2,
        description: 'AI 时代非常流行的“铁柱”下法，极度厚实，无弱点。',
        usage: '当希望彻底封锁角地，不给对手任何借用时使用。5 段必修。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qd]
(;B[oc]
;W[pe]C[正解：铁柱 (Q15)。]
;B[lc]
;W[qg]C[正解：白棋实地坚实。]))`
    },
    {
        id: 'komoku-tsuke-hiki',
        title: '小目高挂·托退定式 (实地)',
        difficulty: 2,
        description: '小目高挂最常用定式，注重角部实地。',
        usage: '当白棋高挂时，黑棋希望稳健拿地。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qd]
(;B[od]C[正解：高挂。]
;W[oc]
;B[nc]
;W[pc]
;B[md]
;W[qf]
;B[ic]C[正解：黑取势，白取地。]))`
    },
    {
        id: 'komoku-large-knight',
        title: '小目小飞挂·大飞应 (灵活)',
        difficulty: 3,
        description: '比小飞应更注重速度和中央配合。',
        usage: '当不想被此时定型，希望保留变化时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qd]
(;B[oc]
;W[pf]C[正解：大飞应。]
;B[qc]
;W[rc]
;B[qb]
;W[re]C[正解：大飞比小飞更轻灵。]))`
    },
    {
        id: 'komoku-two-space-high',
        title: '小目小飞挂·二间高夹 (现代型) 🔥',
        difficulty: 4,
        description: '取自第15届春兰杯 (芈昱廷 vs 井山裕太)。AI 时代更推荐高位夹击，避免被对方盖住，注重攻击主动权。',
        usage: '当希望主动进攻，且不惧怕对方反夹时使用。实战中白棋于 Q7 逼住。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qp]
(;B[oq]
;W[qm]C[正解：二间高夹 (R7)。比低夹更轻灵。(实战中类似黑贴 Q7)]
;B[pp]
;W[qo]
;B[qq]
;W[rq]
;B[ql]
;W[pm]
;B[qr]C[正解：复杂的战斗变化，白棋取势。]))`
    },
    {
        id: 'komoku-high-approach',
        title: '小目一间高挂 (简明型)',
        difficulty: 3,
        description: '高挂取势，简明易懂。',
        usage: '黑棋为了回避复杂的定式变化，或需要高位行棋时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[cp]
(;B[ep]C[正解：高挂。]
;W[eq]
;B[fq]
;W[dq]
;B[fp]
;W[cn]
;B[jp]C[正解： classic joseki.]))`
    },
    {
        id: 'komoku-high-attach-block',
        title: '小目高挂·外靠定式 (压制型) 🔥',
        difficulty: 3,
        description: '取自第15届春兰杯 (许皓鋐 vs 党毅飞)。面对高挂，托-抑 (Tsuke-Osae) 是最强硬的压制手段。',
        usage: '当需要中腹厚势，或者封锁对方时使用。实战中白棋于 D17 面对 C15 高挂直接 C16 靠。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qd]
(;B[od]
;W[oe]C[正解：外靠 (P15)。]
;B[ne]
;W[pe]
;B[md]
;W[nf]
;B[mf]
;W[ng]C[正解：白棋得实地与外势，黑棋外势雄厚。]))`
    },

    // --- AI-2024 (Chunlan Cup / League Pack) ---
    {
        id: 'star-mi-knife-simple',
        title: '星位·芈氏飞刀 (简明闪躲型)',
        difficulty: 4,
        description: '取自第15届春兰杯 (柯洁 vs 芈昱廷)。白棋点三三后，面对黑棋的强硬变化，选择简明取地做活。',
        usage: '当不希望卷入复杂的“芈氏飞刀”大型变化时，此图为双方最佳妥协。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dp]
(;B[cq]C[正解：经典的芈氏飞刀起手。]
;W[cp]
;B[dq]
;W[eq]
;B[fq]
;W[fp]
;B[fr]
;W[cr]
;B[er]
;W[bq]
;B[ep]
;W[do]
;B[eo]
;W[dn]C[正解：白棋弃掉角上两子，换取外围厚势。]))`
    },
    {
        id: 'star-pincer-press-ai',
        title: '星位一间夹·冲断压迫 (AI 新手)',
        difficulty: 5,
        description: '取自第15届春兰杯 (李轩豪 vs 一力辽)。白棋夹击后，黑棋反夹，白棋直接冲断！极具力量感。',
        usage: '当对自己计算力有自信，且希望在序盘直接击溃对手时使用。此形为李轩豪（只有轩）的名局。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dc]
(;B[ce]C[正解：黑棋挂角。]
;W[cg]C[正解：李轩豪选择更紧凑的一间夹。]
;B[ed]
;W[dd]C[正解：冲！]
;B[de]
;W[ee]C[正解：断！最强硬手段。]
;B[ef]
;W[fe]
;B[dg]
;W[gd]C[正解：白棋吃住角部，黑棋取外势，气势恢宏的分担。]))`
    }
];
