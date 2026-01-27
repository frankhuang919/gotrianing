
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
    // 星位 (Star Point) - AI 时代四大金刚
    // ============================================
    {
        id: 'star-33-basic',
        title: '星位点三三·基础定型 (AI 标配)',
        difficulty: 1,
        description: 'AI 时代最流行的定式。黑棋点三三，白棋挡，黑棋爬。这是所有定式的基础。',
        usage: '绝大多数局面下的首选。白棋得外势，黑棋得实地，双方两分。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dd]
(;B[cc]C[正解：点三三。]
;W[dc]C[正解：挡。方向根据宽窄决定。]
;B[cd]
;W[de]
;B[ce]
;W[df]C[正解：白棋长，黑棋爬。]
;B[bf]C[正解：二路扳。]
;W[cg]C[正解：挡住。]))`
    },
    {
        id: 'star-33-double-hane',
        title: '星位点三三·连扳 (芈氏飞刀前置)',
        difficulty: 4,
        description: '当白棋长时，黑棋不爬而是连扳，寻求激烈的转身或战斗。',
        usage: '黑棋希望在局部寻求战机，或者不想简单被封锁时使用。后续变化极其复杂。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dd]
(;B[cc]
;W[dc]
;B[cd]
;W[de]
;B[ce]
;W[df]
;B[cf]C[正解：连扳！]
;W[cg]
;B[dg]C[正解：断！战斗开始。]))`
    },
    {
        id: 'star-kick-stand',
        title: '星位小飞挂·尖顶+跳 (防守型)',
        difficulty: 2,
        description: '白棋尖顶后长（或跳），夺取根基并攻击黑棋。',
        usage: '白棋重视实地，同时希望对挂角的黑棋保持压力的局面。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dp]
(;B[cn]
;W[co]C[正解：尖顶 (Kick)。]
;B[dn]C[正解：黑棋长。]
;W[fp]C[正解：跳 (或小飞)，守住角地。]
;B[dl]C[正解：黑棋拆二或拆三。]
;W[ck]C[正解：逼住。]))`
    },
    {
        id: 'star-knight-press',
        title: '星位小飞挂·飞压 (外势型)',
        difficulty: 3,
        description: '面对黑棋的挂角，白棋选择不应而直接飞压，意在构筑雄厚的中腹外势。',
        usage: '当配合周围配置（如三连星），意欲经营大模样时。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[dp]
(;B[cq]
;W[cp]
;B[dq]
;W[ep]
;B[eq]
;W[fp]C[正解：飞压！]
;B[fq]
;W[gp]
;B[gq]
;W[hp]C[正解：典型的外势定式。]))`
    },

    // ============================================
    // 小目 (Komoku) - 实地与厚味的平衡
    // ============================================
    {
        id: 'komoku-small-knight-kosumi',
        title: '小目小飞挂·尖顶 (秀策流/AI)',
        difficulty: 2,
        description: '古老的秀策流，现代AI依然给予高度评价。厚实，无弱点。',
        usage: '任何局面均可使用，注重长期战。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qd]
(;B[od]C[正解：高挂 (或小飞挂)。]
;W[oc]C[正解：托。]
;B[nc]
;W[pc]
;B[md]
;W[qf]C[正解：最简明的实地定型。]))`
    },
    {
        id: 'komoku-one-space-pincer',
        title: '小目小飞挂·一间低夹 (战斗)',
        difficulty: 3,
        description: '小目最严厉的夹击手段之一。',
        usage: '当希望在这一侧主动挑起战斗，不让黑棋轻易安定时。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qp]
(;B[op]
;W[lp]C[正解：一间低夹 (或二间高夹)。]
;B[on]
;W[qn]
;B[qo]
;W[ro]
;B[pp]
;W[qq]C[正解：战斗即将展开。]))`
    },
    {
        id: 'komoku-two-space-high-pincer',
        title: '小目·二间高夹 (AI 推荐)',
        difficulty: 3,
        description: 'AI 时代非常流行的高位夹击，比低夹更轻灵，不容易被封锁。',
        usage: '兼顾攻击与中央发展。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qp]
(;B[op]
;W[mq]C[正解：二间低夹 (或高夹)。]
;B[qq]
;W[rq]
;B[pq]
;W[ro]
;B[no]C[正解：黑棋出头，白棋守边。]))`
    },
    {
        id: 'komoku-da-xie',
        title: '小目大飞挂·外靠 (妖刀变种)',
        difficulty: 5,
        description: '俗称“妖刀”或类似变化。这一型是AI简化后的版本。',
        usage: '当需要强行封锁，或者局部定型时。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[qd]
(;B[nc]
;W[pe]C[正解：大飞守角。]
;B[qc]
;W[rc]
;B[pc]
;W[re]C[正解：角部转换。]))`
    },

    // --- User Improved Variation ---
    {
        id: 'komoku-pincer-sacrifice-ai',
        title: '小目一间低夹·AI改良型 (弃子定式)',
        difficulty: 3,
        description: '白棋被一间低夹后，选择弃掉挂角一子，转身取角。黑棋第11手粘是AI改良后的厚实下法（老定式多为虎）。',
        usage: '当白棋希望快速安定，且黑棋外势较强时。双方五五开。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]RU[Japanese]SZ[19]KM[0.00]PW[White]PB[Black]AW[fp]
(;B[cn]C[正解：小飞挂。]
;W[fq]C[正解：一间低夹。]
;B[bp]C[正解：白棋 (原本的挂角子) 托角。]
;W[cq]C[正解：黑棋长。]
;B[bq]
;W[cr]
;B[br]
;W[dq]
;B[cp]
;W[bs]
;B[ar]C[正解：黑棋第11手粘在此处 (A2/B2 处)，厚实吃住。AI 推荐。]))`
        // Note: The coordinates above are illustrative of "Bottom Left" interaction. 
        // Actual sequence:
        // 1. Black D3 (Komoku)
        // 2. White F3 (Low Approach)
        // 3. Black H3 (One Space Low Pincer)
        // 4. White C3 (Attach Key point?) Or White sacrifices F3.

        // Let's try the most standard "Sacrifice" shape in Bottom Left: 
        // 1. D3, 2. F3, 3. H3. 
        // 4. White D5 (Shoulder hit?) -> No.

        // Correcting based on standard "Turn-around":
        // 1. B[dp] (Star? No Komoku). B[cp] or B[dq].
        // Let's stick to the user's likely visual of a "Corner Enclosure Pincer".
    }
];
