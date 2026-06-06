import type { DashboardOverview, ScenarioTemplate } from "@/lib/platform-types";

export const threatLabels = {
  grooming: "Grooming",
  phishing: "Phishing",
  deepfake: "Deepfake manipulácia",
  kybersikana: "Kyberšikana",
  oversharing: "Digitálna stopa",
} as const;

export const scenarioTemplates: ScenarioTemplate[] = [
  {
    slug: "grooming-chat",
    title: "Nový kamarát v správach",
    category: "grooming",
    summary: "Žiačka trénuje reakciu na postupné posúvanie hraníc v chate.",
    accent: "#EC4899",
    steps: [
      {
        key: "intro",
        title: "Prvý kontakt",
        situation:
          "Profil s rovesníckou fotkou ti píše, že chodí na susednú školu a chce presunúť konverzáciu do súkromnej apky.",
        question: "Čo urobíš ako prvé?",
        options: [
          {
            id: "move",
            label: "Presuniem chat, veď pôsobí normálne.",
            feedback:
              "Presun mimo bežnej platformy znižuje kontrolu a často je prvý krok k izolácii.",
            principle: "Over identitu a nechaj komunikáciu v prostredí, kde vieš požiadať o pomoc.",
            riskDelta: 34,
            isSafe: false,
          },
          {
            id: "verify",
            label: "Overím si osobu cez spoločných ľudí a nič neposielam.",
            feedback:
              "Správne. Neponáhľaj sa a nezdieľaj nič, čo by sa dalo zneužiť.",
            principle: "Bezpečná reakcia kombinuje overenie identity a minimálne zdieľanie.",
            riskDelta: -18,
            isSafe: true,
          },
        ],
      },
      {
        key: "pressure",
        title: "Tlak na tajomstvo",
        situation:
          "Osoba napíše: 'Nehovor to nikomu, dospelí by to pokazili. Pošli fotku, dokáž mi, že mi veríš.'",
        question: "Ktorá odpoveď je najbezpečnejšia?",
        options: [
          {
            id: "boundary",
            label: "Nepošlem fotku, správu odložím a poviem dôveryhodnému dospelému.",
            feedback:
              "Správne. Tlak na tajomstvo a dokazovanie dôvery je varovný signál.",
            principle: "Pri tlaku na intimitu alebo tajomstvo treba zapojiť dospelého.",
            riskDelta: -24,
            isSafe: true,
          },
          {
            id: "small-photo",
            label: "Pošlem len nenápadnú fotku, aby nebol problém.",
            feedback:
              "Aj nenápadný obsah môže byť začiatok eskalácie. Problémom je samotný tlak.",
            principle: "Bezpečie nerieši 'menej riziková fotka', ale zastavenie tlaku.",
            riskDelta: 31,
            isSafe: false,
          },
        ],
      },
    ],
  },
  {
    slug: "phishing-login",
    title: "Súťaž o slúchadlá",
    category: "phishing",
    summary: "Študent rozlišuje legit ponuku od pokusu o krádež prihlásenia.",
    accent: "#7C3AED",
    steps: [
      {
        key: "link",
        title: "Podivný link",
        situation:
          "V triednom chate pristane link na súťaž. Stránka žiada prihlásenie cez školský mail a heslo.",
        question: "Ako zareaguješ?",
        options: [
          {
            id: "login",
            label: "Prihlásim sa, súťaž má logo známej firmy.",
            feedback:
              "Logo nie je dôkaz. Phishing často kopíruje vizuál dôveryhodnej značky.",
            principle: "Skontroluj doménu, zdroj správy a nikdy neposielaj heslo cez náhodný formulár.",
            riskDelta: 36,
            isSafe: false,
          },
          {
            id: "check-domain",
            label: "Skontrolujem doménu a nahlásim link triednemu učiteľovi.",
            feedback:
              "Správne. Podozrivý link netreba testovať vlastným heslom.",
            principle: "Pri heslách rozhoduje overený kanál, nie dojem zo stránky.",
            riskDelta: -20,
            isSafe: true,
          },
        ],
      },
      {
        key: "urgency",
        title: "Časový tlak",
        situation:
          "Správa tvrdí, že výhra platí iba 10 minút a treba potvrdiť telefónne číslo rodiča.",
        question: "Čo je najlepšie?",
        options: [
          {
            id: "pause",
            label: "Zastavím sa, overím zdroj a nevyplním rodinné údaje.",
            feedback:
              "Správne. Časový tlak je bežný manipulačný prvok.",
            principle: "Naliehavosť je signál na spomalenie, nie na rýchle odoslanie údajov.",
            riskDelta: -16,
            isSafe: true,
          },
          {
            id: "phone",
            label: "Vyplním číslo, nie je to moje heslo.",
            feedback:
              "Telefónne číslo rodiča je osobný údaj a môže slúžiť na ďalší útok.",
            principle: "Phishing nezbiera len heslá, ale aj kontakty a rodinné väzby.",
            riskDelta: 23,
            isSafe: false,
          },
        ],
      },
    ],
  },
  {
    slug: "deepfake-video",
    title: "Video, ktoré sedí až príliš",
    category: "deepfake",
    summary: "Trieda trénuje reakciu na manipulatívny obrazový obsah.",
    accent: "#FF6B6B",
    steps: [
      {
        key: "share",
        title: "Vírusové video",
        situation:
          "Objaví sa video spolužiaka, ktorý vraj uráža učiteľku. Niektoré pohyby úst však nesedia so zvukom.",
        question: "Ako postupuješ pred zdieľaním?",
        options: [
          {
            id: "share-now",
            label: "Prepošlem ho, nech sa k tomu vyjadrí trieda.",
            feedback:
              "Preposlanie môže rozšíriť manipuláciu a zvýšiť škodu aj vtedy, keď chceš pravdu.",
            principle: "Pri možnom deepfake najprv zastav šírenie a over kontext.",
            riskDelta: 29,
            isSafe: false,
          },
          {
            id: "verify-context",
            label: "Nezdieľam ho a overím zdroj u dôveryhodnej osoby.",
            feedback:
              "Správne. Vizuálne podozrivý obsah potrebuje overenie pred reakciou.",
            principle: "Zastavenie šírenia je aktívna ochrana poškodeného.",
            riskDelta: -22,
            isSafe: true,
          },
        ],
      },
    ],
  },
  {
    slug: "kybersikana-group",
    title: "Skupina bez jedného človeka",
    category: "kybersikana",
    summary: "Študent rozpoznáva, kedy humor v skupine prekročí hranicu.",
    accent: "#4C1D95",
    steps: [
      {
        key: "meme",
        title: "Meme v skupine",
        situation:
          "V skupine sa šíri meme zo spolužiakovej fotky. Všetci reagujú smiechom, spolužiak v skupine nie je.",
        question: "Čo je zodpovedná reakcia?",
        options: [
          {
            id: "like",
            label: "Dám reakciu, veď meme nevzniklo odo mňa.",
            feedback:
              "Reakcie posilňujú šírenie. Aj pasívna podpora zvyšuje tlak na obeť.",
            principle: "Kyberšikana stojí aj na publiku, nie iba na autorovi.",
            riskDelta: 27,
            isSafe: false,
          },
          {
            id: "stop",
            label: "Napíšem, že to nie je v poriadku, a uložím dôkaz pre dospelého.",
            feedback:
              "Správne. Pomoc znamená zastaviť šírenie a zachovať dôkaz.",
            principle: "Bezpečná reakcia chráni človeka a zároveň umožní riešenie.",
            riskDelta: -20,
            isSafe: true,
          },
        ],
      },
    ],
  },
  {
    slug: "oversharing-profile",
    title: "Verejný profil po víkende",
    category: "oversharing",
    summary: "Scenár ukazuje, koľko sa dá odvodiť z bežných príspevkov.",
    accent: "#0F766E",
    steps: [
      {
        key: "routine",
        title: "Stabilný režim",
        situation:
          "Na verejný profil pridávaš story zo zastávky každé ráno a fotky z krúžku každý utorok.",
        question: "Čo je najmenšie riziko?",
        options: [
          {
            id: "delay",
            label: "Zverejním až neskôr a bez presnej lokality.",
            feedback:
              "Správne. Oneskoenie a menej metadát znižujú odvoditeľnosť režimu.",
            principle: "Nie je nutné prestať zdieľať všetko, stačí znížiť presnosť signálu.",
            riskDelta: -15,
            isSafe: true,
          },
          {
            id: "live",
            label: "Dám to live, veď ma sledujú hlavne spolužiaci.",
            feedback:
              "Verejný profil nie je triedna skupina. Live lokácia vytvára predvídateľný vzorec.",
            principle: "Pri verejnom profile rátaj aj s neznámym publikom.",
            riskDelta: 25,
            isSafe: false,
          },
        ],
      },
    ],
  },
];

export const presentationDashboard: DashboardOverview = {
  updatedAt: "2026-06-06T10:00:00.000Z",
  sampleSize: 126,
  completionRate: 91,
  targetReduction: 25,
  averageBachavost: 3,
  categories: [
    {
      category: "grooming",
      label: threatLabels.grooming,
      errorRate: 31,
      improvement: 28,
      responses: 244,
    },
    {
      category: "phishing",
      label: threatLabels.phishing,
      errorRate: 24,
      improvement: 34,
      responses: 252,
    },
    {
      category: "deepfake",
      label: threatLabels.deepfake,
      errorRate: 37,
      improvement: 19,
      responses: 126,
    },
    {
      category: "kybersikana",
      label: threatLabels.kybersikana,
      errorRate: 22,
      improvement: 31,
      responses: 126,
    },
    {
      category: "oversharing",
      label: threatLabels.oversharing,
      errorRate: 29,
      improvement: 26,
      responses: 126,
    },
  ],
  scoreDistribution: [
    { score: 0, label: "0", count: 4, percentage: 3 },
    { score: 1, label: "1", count: 12, percentage: 10 },
    { score: 2, label: "2", count: 26, percentage: 21 },
    { score: 3, label: "3", count: 38, percentage: 30 },
    { score: 4, label: "4", count: 30, percentage: 24 },
    { score: 5, label: "5", count: 16, percentage: 13 },
  ],
  riskAreas: [
    "Tlak na tajomstvo pri groomingu",
    "Časová naliehavosť pri phishingu",
    "Automatické preposielanie videí",
  ],
  timeline: [
    { label: "Vstup", unsafeRate: 42, offlineActivity: 38 },
    { label: "Týžd. 2", unsafeRate: 35, offlineActivity: 44 },
    { label: "Týžd. 4", unsafeRate: 29, offlineActivity: 51 },
    { label: "Týžd. 8", unsafeRate: 24, offlineActivity: 57 },
  ],
};
