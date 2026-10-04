export const MONEY_GROUPS = ["Advisor", "Banking", "Lending", "Insurance", "Tax"] as const;

export type MoneyGroup = (typeof MONEY_GROUPS)[number];

export type MoneyClip = {
  id: string;
  group: MoneyGroup;
  title: string;
  source: string;
  page: string;
  youtube: string;
  blurb: string;
};

/** Official clips. The picture is the video still. The page is the record. */
export const moneyClips: MoneyClip[] = [
  {
    id: "money-adviser",
    group: "Advisor",
    title: "What an investment adviser does",
    source: "SEC",
    page: "https://adviserinfo.sec.gov/",
    youtube: "lQY9KyCfX6Q",
    blurb: "An investment adviser is registered to give advice and can manage the account. A broker recommends a trade and you decide. Check the SEC record before you hire either one.",
  },
  {
    id: "money-broker",
    group: "Advisor",
    title: "Broker or investment adviser",
    source: "SEC",
    page: "https://brokercheck.finra.org/",
    youtube: "FZNCce1spHQ",
    blurb: "A broker is paid to recommend and place a trade. An adviser is paid to watch the account and can decide for you. Many people are both. BrokerCheck shows which one you are talking to.",
  },
  {
    id: "money-choose",
    group: "Advisor",
    title: "Which professional is right",
    source: "SEC",
    page: "https://www.investor.gov/",
    youtube: "PX-WXjTw5OY",
    blurb: "If you want someone managing the account as the market moves, that is an adviser. If you buy a few funds and hold them, a broker may be enough. Ask what you are paying for.",
  },
  {
    id: "money-fees",
    group: "Advisor",
    title: "How advisers and brokers are paid",
    source: "SEC",
    page: "https://www.investor.gov/introduction-investing/getting-started/working-investment-professional",
    youtube: "talDyeUwsWE",
    blurb: "A broker is paid a commission when you buy or sell. An adviser is paid a fee on the whole account, even when you do not trade. Know which bill you are taking on.",
  },
  {
    id: "money-deposits",
    group: "Banking",
    title: "Deposit insurance",
    source: "FDIC",
    page: "https://www.fdic.gov/",
    youtube: "VM8DODp68Oc",
    blurb: "Deposit insurance covers the money the bank holds for you, up to the limit, if the bank fails. It does not cover a drop in the stock market.",
  },
  {
    id: "money-loan",
    group: "Lending",
    title: "The loan approval process",
    source: "FDIC",
    page: "https://www.fdic.gov/consumer-resource-center",
    youtube: "RkmWCI-JtL8",
    blurb: "A lender looks at income, debt, and credit before a loan is approved. This is how that review works. It is not a house for sale.",
  },
  {
    id: "money-life",
    group: "Insurance",
    title: "Understanding life insurance",
    source: "NAIC",
    page: "https://content.naic.org/consumer",
    youtube: "zM61V4PuQ8w",
    blurb: "Life insurance pays the people you name if you die. Know what the policy covers, what it costs, and how long it lasts before you sign.",
  },
  {
    id: "money-tax",
    group: "Tax",
    title: "Free tax preparation",
    source: "IRS",
    page: "https://www.irs.gov/filing",
    youtube: "3zmzQgWs-YI",
    blurb: "A simple return can be filed free with a certified volunteer, or you can e-file it yourself. Bring your ID, W-2s, and Social Security cards.",
  },
];
