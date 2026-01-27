
export interface JosekiPattern {
    id: string;
    title: string;
    difficulty: number;
    sgf: string;
    description: string;
    usage: string;
}

export const josekiLibrary: JosekiPattern[] = [
    {
        id: 'star-33',
        title: '星位点三三 (AI 标配)',
        difficulty: 1,
        description: 'AI 时代最流行的定式，取地快速。',
        usage: '适合注重实地、快速展开布局的局面。几乎百搭。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]
RU[Japanese]SZ[19]KM[0.00]
PW[White]PB[Black]
AW[dp]
(;B[cq]C[正解：点三三是 AI 时代对付星位的首选。]
;W[cp]
;B[dq]
;W[ep]
;B[eq]
;W[fq]
;B[fr]
;W[gr]
;B[er]
;W[gq]C[正解：黑棋取地，白棋取势，定式完成。])
(;B[cn]C[俗手：普通挂角在 AI 看来稍显亏损。]
;W[fq]C[白棋尖顶，黑棋稍苦。])
)`
    },
    {
        id: 'star-low-approach',
        title: '星位小飞挂·小飞应 (实地型)',
        difficulty: 2,
        description: '面对小飞挂，白棋小飞应是稳健的着法，黑棋随后点三三。',
        usage: '当白棋希望稳健防守角地，不希望局面过于复杂时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]
RU[Japanese]SZ[19]KM[0.00]
PW[White]PB[Black]
AW[pd]
(;B[qf]C[正解：小飞挂是常用手段。]
;W[nc]
;B[qd]
;W[qc]
;B[rc]
;W[qe]
;B[rd]
;W[re]
;B[qb]
;W[pf]C[正解：白棋取外势，黑棋得其实地。])
(;B[nc]C[错着：方向选择需谨慎。]
;W[pf]C[白棋夹击，黑棋被动。])
)`
    },
    {
        id: 'star-high-approach',
        title: '星位一间高挂 (取势)',
        difficulty: 3,
        description: '高挂常用于破坏白棋模样。',
        usage: '当想要经营外势，或者防止对方围成大模样时推荐。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]
RU[Japanese]SZ[19]KM[0.00]
PW[White]PB[Black]
AW[dd]
(;B[fd]C[正解：高挂。]
;W[fc]
;B[bd]
;W[cc]
;B[ci]C[正解：双方和平分配合理。])
(;B[fe]C[俗手：太高，不仅没压住，反被穿。]
;W[df]C[白棋冲出，黑棋难受。])
)`
    },
    {
        id: 'komoku-low-approach',
        title: '小目小飞挂 (尖顶定式)',
        difficulty: 2,
        description: '小目定式中最基础的变化。',
        usage: '黑棋希望获得厚势，对攻击白棋或者围外势有利。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]
RU[Japanese]SZ[19]KM[0.00]
PW[White]PB[Black]
AW[qp]
(;B[op]C[正解：P4 挂角。]
;W[pn]
;B[qq]
;W[rq]
;B[pq]
;W[ro]
;B[on]C[正解：黑棋厚实。])
(;B[qo]C[错着：碰角不明智。]
;W[po]
;B[rp]
;W[qq]C[黑棋被封锁。])
)`
    },
    {
        id: 'komoku-high-approach',
        title: '小目一间高挂 (简明型)',
        difficulty: 3,
        description: '高挂取势，简明易懂。',
        usage: '黑棋为了回避复杂的定式变化，或需要高位行棋时使用。',
        sgf: `(;GM[1]FF[4]CA[UTF-8]AP[ZenGo]ST[2]
RU[Japanese]SZ[19]KM[0.00]
PW[White]PB[Black]
AW[cp]
(;B[ep]C[正解：高挂。]
;W[eq]
;B[fq]
;W[dq]
;B[fp]
;W[cn]
;B[jp]C[正解： classic joseki.])
(;B[eq]C[俗手：直接碰上去容易帮白棋围空。]
;W[dq]
;B[ep]
;W[dn]C[白棋实地很大。])
)`
    }
];
