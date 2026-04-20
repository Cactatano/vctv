/* ═══════════════════════════════════════════════════════════════
   VCtv TM — data.js
   Catálogo completo das edições da VCtv.  Cada objeto representa
   uma edição publicada e contém todos os metadados necessários
   para renderizar cards, galeria, resultados de busca e o
   contexto do VCai.
   Formato mantido conforme especificação do PROMPT MESTRE.
   =========================================================== */

window.VCTV_DATA = window.VCTV_DATA || {};

/* ─── EQUIPE ─────────────────────────────────────────────── */
window.VCTV_DATA.EQUIPE = [
  {
    id: 'caetano',
    nome: 'Caetano',
    papel: 'Criador · Editor-chefe',
    emoji: '🧑‍💻',
    bio: 'Criador da VCtv. Pesquisa, escreve e monta as edições semana a semana. Cuida do layout, do site e da identidade visual.',
  },
  {
    id: 'jaron',
    nome: 'Jaron',
    papel: 'Redação · Conteúdo',
    emoji: '✍️',
    bio: 'Redator principal das Edições da Semana. Traz pauta, apuração e a voz do jornal.',
  },
  {
    id: 'erico',
    nome: 'Érico',
    papel: 'Colaborador',
    emoji: '🎨',
    bio: 'Colabora na construção de cada edição — ideias, revisão, ajustes. Parte importante da evolução do projeto.',
  },
];

/* ─── EDIÇÕES ────────────────────────────────────────────── */
window.VCTV_DATA.EDICOES = [
  {
    id: 'mini-6g-15abr2026',
    numero: null,
    tipo: 'mini',
    categoria: 'Tecnologia',
    icone: '📡',
    titulo: 'O Futuro da Internet (6G)',
    data: '2026-04-15',
    dataExibicao: '15 de abril de 2026',
    paginas: 4,
    criador: 'Caetano',
    temas: ['6G', 'tecnologia', 'telecomunicações', 'IMT-2030', '3GPP'],
    resumo: 'ITU define IMT-2030 como padrão do 6G, com requisitos técnicos aprovados em março de 2026. 3GPP padroniza especificações globais. IA/ML integrada à rede. FCC debate segurança e espectro. Lançamento comercial previsto para 2030+.',
    arquivo: 'VCtv_Mini_6G.pdf',
    corTema: '#a050f0',
    destaque: true,
  },
  {
    id: 'especial-artemis2-completo-14abr2026',
    numero: null,
    tipo: 'especial',
    categoria: 'Espaço',
    icone: '🚀',
    titulo: 'Artemis II — Missão Completa',
    data: '2026-04-14',
    dataExibicao: '14 de abril de 2026',
    paginas: 10,
    criador: 'Caetano',
    temas: ['Artemis II', 'NASA', 'Lua', 'Splashdown', 'Earthset'],
    resumo: 'Cobertura completa do 1º voo tripulado lunar em 50 anos. Splashdown, recordes, 12 curiosidades, pós-missão em Houston e o futuro do programa Artemis.',
    arquivo: 'VCtv_News_Edicao3_Artemis_II.pdf',
    corTema: '#3B82F6',
  },
  {
    id: 'mini-mundo100-13abr2026',
    numero: null,
    tipo: 'mini',
    categoria: 'Ciência',
    icone: '🌍',
    titulo: 'Como Será o Mundo em 100 Anos',
    data: '2026-04-13',
    dataExibicao: '13 de abril de 2026',
    paginas: 4,
    criador: 'Caetano',
    temas: ['futurismo', 'IPCC', 'clima', 'demografia', 'IEA'],
    resumo: 'ONU, IPCC, IEA e OCDE: planeta mais velho e populoso, temperatura 1–5,7°C acima, energia mais limpa, economia mais lenta e cidades adaptadas ao clima.',
    arquivo: 'VCtv_Mini_Mundo100.pdf',
    corTema: '#0D9488',
  },
  {
    id: 'edicao3-11abr2026',
    numero: 3,
    tipo: 'semana',
    categoria: 'Edição da Semana',
    icone: '📰',
    titulo: 'VCtv News — Edição 3',
    data: '2026-04-11',
    dataExibicao: '11 de abril de 2026',
    paginas: 12,
    criador: 'Jaron',
    temas: ['Artemis II', 'OpenAI', 'fusão nuclear', 'fraudes digitais', 'Vale do Sinos'],
    resumo: 'Artemis II volta da Lua com recorde histórico. OpenAI e IA corporativa. Intel e Google na corrida por chips. Fusão nuclear com ARPA-E. Fraudes digitais. Vale do Sinos e Rio dos Sinos em São Leopoldo.',
    arquivo: 'VCtv_Edicao3_11Abril.pdf',
    corTema: '#00e66e',
  },
  {
    id: 'especial-artemis2-08abr2026',
    numero: null,
    tipo: 'especial',
    categoria: 'Espaço',
    icone: '🌙',
    titulo: 'Artemis II — Edição Especial',
    data: '2026-04-08',
    dataExibicao: '8 de abril de 2026',
    paginas: 7,
    criador: 'Caetano',
    temas: ['Artemis II', 'NASA', 'Lua', 'SLS', 'Orion'],
    resumo: 'NASA lança Artemis II em 1º de abril de 2026 — 1ª missão tripulada lunar em 50 anos. Tripulação, trajetória, testes em voo, recorde de distância e retorno para Artemis III.',
    arquivo: 'VCtv_Artemis2.pdf',
    corTema: '#1E40AF',
  },
  {
    id: 'mini-internet-07abr2026',
    numero: null,
    tipo: 'mini',
    categoria: 'Tecnologia',
    icone: '💻',
    titulo: 'Como Funciona a Internet',
    data: '2026-04-07',
    dataExibicao: '7 de abril de 2026',
    paginas: 4,
    criador: 'Caetano',
    temas: ['internet', 'IP', 'DNS', 'TCP', 'HTTP', '5G', 'HTTPS'],
    resumo: 'IP, DNS, TCP, HTTP e 5G explicados do zero. A sequência completa de abrir um site, dados móveis, segurança HTTPS e o que muda a velocidade da sua conexão.',
    arquivo: 'VCtv_Mini_Internet.pdf',
    corTema: '#0891B2',
  },
  {
    id: 'edicao2-04abr2026',
    numero: 2,
    tipo: 'semana',
    categoria: 'Edição da Semana',
    icone: '📰',
    titulo: 'VCtv News — Edição 2',
    data: '2026-04-04',
    dataExibicao: '4 de abril de 2026',
    paginas: 10,
    criador: 'Jaron',
    temas: ['clima', 'data centers', 'IA', 'e-sports', 'computação quântica', 'PIX'],
    resumo: 'Brasil 2026: Plano Clima, data centers, IA, e-sports, computação quântica, hidrogênio verde, saúde digital, educação, fintechs, PIX e previsão do tempo RS.',
    arquivo: 'VCtv_NEWS_Edicao2.pdf',
    corTema: '#00e66e',
  },
  {
    id: 'especial-1abril2026',
    numero: null,
    tipo: 'especial',
    categoria: 'Humor',
    icone: '🎭',
    titulo: 'Edição Especial de 1º de Abril',
    data: '2026-04-01',
    dataExibicao: '1 de abril de 2026',
    paginas: 5,
    criador: 'Caetano',
    temas: ['humor', '1º de abril', 'sátira'],
    resumo: 'Uma edição diferente de tudo que você já viu. Ministério do Nada, inflação em nível de paciência, data center que pede ponto e outras reportagens cuidadosamente apuradas.',
    arquivo: 'VCtv_Especial_1Abril2026.pdf',
    corTema: '#E11D48',
  },
  {
    id: 'mini-biocomp-30mar2026',
    numero: null,
    tipo: 'mini',
    categoria: 'Ciência',
    icone: '🧬',
    titulo: 'Computadores Biológicos',
    data: '2026-03-30',
    dataExibicao: '30 de março de 2026',
    paginas: 3,
    criador: 'Caetano',
    temas: ['DNA', 'wetware', 'biocomputação', 'CL1'],
    resumo: 'DNA executa aprendizado supervisionado in vitro. Árvores de decisão com 333 fitas. Neurônios reais integrados a hardware (CL1). Armazenamento com dezenas de exabytes por grama.',
    arquivo: 'Mini_edicao_computadores_biologicos.pdf',
    corTema: '#14B8A6',
  },
  {
    id: 'mini-cameras-29mar2026',
    numero: null,
    tipo: 'mini',
    categoria: 'Foto',
    icone: '📷',
    titulo: 'Câmeras e Fotografia',
    data: '2026-03-29',
    dataExibicao: '29 de março de 2026',
    paginas: 4,
    criador: 'Caetano',
    temas: ['câmeras', 'smartphones', 'DxOMark', 'fotografia'],
    resumo: 'Huawei Pura 80 Ultra lidera DxOMark 2025. Canon EOS R5 com vídeo 8K. Nikon Z9 com 493 pts AF. Mercado global de câmeras cresce 8,3% ao ano.',
    arquivo: 'Vctv_mini_edicao_2_-_câmeras_.pdf',
    corTema: '#F59E0B',
  },
  {
    id: 'mini-auto-29mar2026',
    numero: null,
    tipo: 'mini',
    categoria: 'Auto',
    icone: '🏎',
    titulo: 'Automobilismo',
    data: '2026-03-29',
    dataExibicao: '29 de março de 2026',
    paginas: 3,
    criador: 'Caetano',
    temas: ['F1', 'Stock Car', 'Hamilton', 'Antonelli'],
    resumo: 'Antonelli vence o GP da China. Hamilton estreia no pódio pela Ferrari. Novas regras em Suzuka. Di Mauro lidera a Stock Car por 1 ponto sobre Fraga.',
    arquivo: 'VCtv_MiniEdicao_Auto_29mar2026.pdf',
    corTema: '#E10600',
  },
  {
    id: 'mini-ia-28mar2026',
    numero: null,
    tipo: 'mini',
    categoria: 'Tech',
    icone: '🤖',
    titulo: 'Inteligência Artificial',
    data: '2026-03-28',
    dataExibicao: '28 de março de 2026',
    paginas: 3,
    criador: 'Caetano',
    temas: ['IA', 'PBIA', 'Brasil', 'data centers', 'educação'],
    resumo: 'Mercado global de IA chega a US$376 bi em 2026. Brasil investe R$23 bi no Plano Nacional de IA. Data centers podem dobrar consumo de energia.',
    arquivo: 'Vctv_mini_1_-_AI__1_.pdf',
    corTema: '#A855F7',
  },
  {
    id: 'edicao1-28mar2026',
    numero: 1,
    tipo: 'semana',
    categoria: 'Edição da Semana',
    icone: '📰',
    titulo: 'VCtv News — Edição 1',
    data: '2026-03-28',
    dataExibicao: '28 de março de 2026',
    paginas: 3,
    criador: 'Caetano',
    temas: ['Plano Clima', 'First Stand LoL', 'hidrogênio verde', 'tempo RS'],
    resumo: 'Plano Clima nacional, cenário global 2026, Brasil hub de data centers, First Stand 2026 de LoL no Brasil, previsão do tempo no RS e ciência de ponta.',
    arquivo: 'VCtv_News_28mar2026_final.pdf',
    corTema: '#00e66e',
  },
];

/* ─── META INFO ──────────────────────────────────────────── */
window.VCTV_DATA.META = {
  nome: 'VCtv TM',
  tagline: 'O jornal feito por você, pra VC.',
  ano: 2026,
  canal: 'https://whatsapp.com/channel/0029VbCaofNGk1FuHSPhca17',
  descricaoCurta: 'Jornal digital semanal sobre tecnologia, ciência, espaço e cultura.',
  introVersion: 'vctv-tm-v1',
  site: 'https://cactatano.github.io/vctv/',
};

/* ─── HELPERS ────────────────────────────────────────────── */
window.VCTV_DATA.helpers = {
  getById(id) {
    return window.VCTV_DATA.EDICOES.find((e) => e.id === id) || null;
  },
  getByType(tipo) {
    return window.VCTV_DATA.EDICOES.filter((e) => e.tipo === tipo);
  },
  getLatest(n) {
    const copy = [...window.VCTV_DATA.EDICOES];
    copy.sort((a, b) => new Date(b.data) - new Date(a.data));
    return copy.slice(0, n || 1);
  },
  getFeatured() {
    return window.VCTV_DATA.EDICOES.find((e) => e.destaque) || window.VCTV_DATA.helpers.getLatest(1)[0];
  },
  searchTitle(query) {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    return window.VCTV_DATA.EDICOES.filter((e) => {
      return (
        e.titulo.toLowerCase().includes(q) ||
        e.categoria.toLowerCase().includes(q) ||
        e.temas.some((t) => t.toLowerCase().includes(q)) ||
        (e.resumo || '').toLowerCase().includes(q)
      );
    });
  },
  /* Constrói uma string curta com o catálogo inteiro para
     injetar no prompt do VCai / busca. */
  catalogSummary() {
    return window.VCTV_DATA.EDICOES
      .map((e) => {
        const numPart = e.numero ? `nº${e.numero}` : '';
        const tipoLabel = e.tipo === 'semana' ? 'Semana' : e.tipo === 'mini' ? 'Mini' : 'Especial';
        return `• [${tipoLabel}${numPart ? ' ' + numPart : ''}] ${e.titulo} (${e.dataExibicao}) — ${e.resumo}`;
      })
      .join('\n');
  },
  /* Versão JSON compacta para a busca com IA */
  catalogJSON() {
    return JSON.stringify(
      window.VCTV_DATA.EDICOES.map((e) => ({
        id: e.id,
        titulo: e.titulo,
        tipo: e.tipo,
        data: e.dataExibicao,
        resumo: e.resumo,
        temas: e.temas,
      }))
    );
  },
};
