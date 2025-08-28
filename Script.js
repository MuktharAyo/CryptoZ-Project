// const toggleMenu = () => {
//   document.querySelector(".hamburger").classList.toggle("active");
//   document.querySelector(".mobile-menu").classList.toggle("active");
// };

// document.querySelector(".hamburger").onclick = toggleMenu;
// document
//   .querySelectorAll(".mobile-menu a")
//   .forEach(
//     (link) =>
//       (link.onclick = () =>
//         document.querySelector(".mobile-menu").classList.remove("active"))
//   );

const hamburger = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const navLinks = document.querySelectorAll("nav ul li a");
const navBtns = document.querySelector(".nav-btns");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  mobileMenu.classList.toggle("active");
  navLinks.forEach((link) => link.classList.toggle("active"));
  navBtns.classList.toggle("active");
});

// Currency Converter
/* Complete JS for currency converter — dropdowns are children of each pill's .currency-dropdown container */
(() => {
  // Global state
  let cryptoCurrencies = [];
  let fiatRates = {};
  let allCurrencies = [];
  let fromCurrency = "bitcoin";
  let toCurrency = "usd";
  let conversion = null;
  let lastUpdated = new Date();

  // Fiat currencies data
  const FIAT_CURRENCIES = [
    {
      id: "usd",
      symbol: "USD",
      name: "US Dollar",
      current_price: 1,
      type: "fiat",
    },
    { id: "eur", symbol: "EUR", name: "Euro", current_price: 1, type: "fiat" },
    {
      id: "gbp",
      symbol: "GBP",
      name: "British Pound",
      current_price: 1,
      type: "fiat",
    },
    {
      id: "jpy",
      symbol: "JPY",
      name: "Japanese Yen",
      current_price: 1,
      type: "fiat",
    },
    {
      id: "cad",
      symbol: "CAD",
      name: "Canadian Dollar",
      current_price: 1,
      type: "fiat",
    },
    {
      id: "aud",
      symbol: "AUD",
      name: "Australian Dollar",
      current_price: 1,
      type: "fiat",
    },
    {
      id: "chf",
      symbol: "CHF",
      name: "Swiss Franc",
      current_price: 1,
      type: "fiat",
    },
    {
      id: "cny",
      symbol: "CNY",
      name: "Chinese Yuan",
      current_price: 1,
      type: "fiat",
    },
    {
      id: "inr",
      symbol: "INR",
      name: "Indian Rupee",
      current_price: 1,
      type: "fiat",
    },
    {
      id: "krw",
      symbol: "KRW",
      name: "South Korean Won",
      current_price: 1,
      type: "fiat",
    },
    {
      id: "brl",
      symbol: "BRL",
      name: "Brazilian Real",
      current_price: 1,
      type: "fiat",
    },
    {
      id: "rub",
      symbol: "RUB",
      name: "Russian Ruble",
      current_price: 1,
      type: "fiat",
    },
  ];

  // DOM elements (note: added fromPill and toPill for new markup)
  const elements = {
    loadingState: document.getElementById("loadingState"),
    errorDisplay: document.getElementById("errorDisplay"),
    errorMessage: document.getElementById("errorMessage"),
    closeError: document.getElementById("closeError"),
    mainConverter: document.getElementById("mainConverter"),
    currencyCategories: document.getElementById("currencyCategories"),
    lastUpdated: document.getElementById("lastUpdated"),
    refreshBtn: document.getElementById("refreshBtn"),

    // From currency elements (using pill-based markup)
    fromPill: document.getElementById("fromPill"),
    fromDropdownMenu: document.getElementById("fromDropdownMenu"),
    fromSearch: document.getElementById("fromSearch"),
    fromCurrencyList: document.getElementById("fromCurrencyList"),
    fromFlag: document.getElementById("fromFlag"),
    fromCode: document.getElementById("fromCode"),
    fromPillValue: document.getElementById("fromPillValue"),

    // To currency elements
    toPill: document.getElementById("toPill"),
    toDropdownMenu: document.getElementById("toDropdownMenu"),
    toSearch: document.getElementById("toSearch"),
    toCurrencyList: document.getElementById("toCurrencyList"),
    toFlag: document.getElementById("toFlag"),
    toCode: document.getElementById("toCode"),
    toPillValue: document.getElementById("toPillValue"),

    // Other elements (your existing main UI pieces)
    amountInput: document.getElementById("amountInput"),
    swapBtn: document.getElementById("swapBtn"),
    resultField: document.getElementById("resultValue"), // result display
    summaryTotal: document.getElementById("summaryTotal"),
    summaryRate: document.getElementById("summaryRate"),
    summaryUpdated: document.getElementById("summaryUpdated"),
    topCryptos: document.getElementById("topCryptos"),
    topFiats: document.getElementById("topFiats"),
  };

  /* -------------------------
     Utility / formatting
     ------------------------- */
  function showElement(el) {
    if (el) el.classList.remove("hidden");
  }
  function hideElement(el) {
    if (el) el.classList.add("hidden");
  }
  function prettyTime(d) {
    return d.toLocaleTimeString();
  }

  function formatPrice(price, currency) {
    if (!currency) return Number(price).toFixed(4);
    if (currency.type === "fiat") {
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: currency.symbol.toUpperCase(),
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        }).format(price);
      } catch (e) {
        return `${currency.symbol.toUpperCase()} ${Number(price).toFixed(4)}`;
      }
    }
    if (price < 0.01) return Number(price).toFixed(8);
    return Number(price).toFixed(6);
  }

  function getCurrencyIconHTML(currency) {
    if (!currency) return "🏳️";
    if (currency.type === "fiat") {
      const map = {
        USD: "🇺🇸",
        EUR: "🇪🇺",
        GBP: "🇬🇧",
        JPY: "🇯🇵",
        CAD: "🇨🇦",
        AUD: "🇦🇺",
        CHF: "🇨🇭",
        CNY: "🇨🇳",
        INR: "🇮🇳",
        KRW: "🇰🇷",
        BRL: "🇧🇷",
        RUB: "🇷🇺",
      };
      return map[(currency.symbol || "").toUpperCase()] || "🏳️";
    }
    if (currency.image)
      return `<img src="${currency.image}" alt="${currency.name}" style="width:100%;height:100%;object-fit:cover;">`;
    return (currency.symbol || "").slice(0, 2).toUpperCase();
  }

  /* -------------------------
     API fetchers
     ------------------------- */
  async function fetchCryptoCurrencies() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const resp = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false",
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!resp.ok) throw new Error("Crypto API error: " + resp.status);
      const data = await resp.json();
      cryptoCurrencies = data.map((c) => ({
        id: c.id,
        symbol: (c.symbol || "").toUpperCase(),
        name: c.name,
        current_price: c.current_price,
        image: c.image,
        price_change_percentage_24h: c.price_change_percentage_24h,
        type: "crypto",
      }));
      return cryptoCurrencies;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn("crypto fetch failed", err);
      cryptoCurrencies = [];
      throw err;
    }
  }

  async function fetchFiatRates() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const resp = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD",
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      if (!resp.ok) throw new Error("Fiat API error: " + resp.status);
      const data = await resp.json();
      fiatRates = data.rates || {};
      return fiatRates;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn("fiat fetch failed — using fallback", err);
      fiatRates = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110,
        CAD: 1.25,
        AUD: 1.35,
        CHF: 0.92,
        CNY: 6.45,
        INR: 74.5,
        KRW: 1180,
        BRL: 5.2,
        RUB: 73.5,
      };
      return fiatRates;
    }
  }

  /* -------------------------
     Update everything & UI
     ------------------------- */
  async function updateAllCurrencies() {
    try {
      showElement(elements.loadingState);
      hideElement(elements.mainConverter);
      hideElement(elements.currencyCategories);

      const [cr, fr] = await Promise.all([
        fetchCryptoCurrencies(),
        fetchFiatRates(),
      ]);

      // Build fiat objects with USD-based current_price
      const updatedFiats = FIAT_CURRENCIES.map((f) => ({
        ...f,
        current_price: f.id === "usd" ? 1 : 1 / (fr[f.symbol] || 1),
      }));

      allCurrencies = [...cryptoCurrencies, ...updatedFiats];
      lastUpdated = new Date();
      elements.summaryUpdated &&
        (elements.summaryUpdated.textContent = `Last updated: ${prettyTime(
          lastUpdated
        )}`);

      populateDropdowns();
      updatePillsAndConvert();

      hideElement(elements.loadingState);
      showElement(elements.mainConverter);
      showElement(elements.currencyCategories);
    } catch (err) {
      hideElement(elements.loadingState);
      showError(
        err && err.message ? err.message : "Failed to fetch currency data"
      );
    }
  }

  /* -------------------------
     Conversion & summary
     ------------------------- */
  function convertCurrency() {
    const raw = parseFloat(elements.amountInput.value);
    const amount = isFinite(raw) && raw > 0 ? raw : 0;
    const from = allCurrencies.find((c) => c.id === fromCurrency);
    const to = allCurrencies.find((c) => c.id === toCurrency);

    if (!from || !to) {
      if (elements.resultField) elements.resultField.textContent = "Loading...";
      if (elements.summaryTotal) elements.summaryTotal.textContent = "—";
      if (elements.summaryRate)
        elements.summaryRate.textContent = "Exchange Rate: —";
      return;
    }

    let rate = 1;
    if (from.type === "crypto" && to.type === "crypto")
      rate = from.current_price / to.current_price;
    else if (from.type === "crypto" && to.type === "fiat") {
      const usdValue = from.current_price;
      rate =
        to.id === "usd"
          ? usdValue
          : usdValue * (fiatRates[(to.symbol || "").toUpperCase()] || 1);
    } else if (from.type === "fiat" && to.type === "crypto") {
      let usdValue =
        from.id === "usd"
          ? 1
          : 1 / (fiatRates[(from.symbol || "").toUpperCase()] || 1);
      rate = usdValue / to.current_price;
    } else {
      // fiat -> fiat
      if ((from.id || "").toLowerCase() === "usd")
        rate = fiatRates[(to.symbol || "").toUpperCase()] || 1;
      else if ((to.id || "").toLowerCase() === "usd")
        rate = 1 / (fiatRates[(from.symbol || "").toUpperCase()] || 1);
      else {
        const fromRate = fiatRates[(from.symbol || "").toUpperCase()] || 1;
        const toRate = fiatRates[(to.symbol || "").toUpperCase()] || 1;
        rate = toRate / fromRate;
      }
    }

    const result = amount * rate;

    // Result display
    if (elements.resultField) {
      if (to.type === "fiat")
        elements.resultField.textContent = `${formatPrice(result, to)} (${(
          to.symbol || ""
        ).toUpperCase()})`;
      else
        elements.resultField.textContent = `${Number(result).toFixed(8)} ${(
          to.symbol || ""
        ).toUpperCase()}`;
    }

    // Summary: total & rate & last updated
    if (elements.summaryTotal) {
      const totalText =
        to.type === "fiat"
          ? `${amount} ${from.name} = ${formatPrice(result, to)}`
          : `${amount} ${from.name} = ${Number(result).toFixed(8)} ${(
              to.symbol || ""
            ).toUpperCase()}`;
      elements.summaryTotal.textContent = totalText;
    }
    if (elements.summaryRate) {
      const rateText =
        to.type === "fiat"
          ? `Exchange Rate: 1 ${from.name} = ${formatPrice(rate, to)}`
          : `Exchange Rate: 1 ${from.name} = ${Number(rate).toFixed(8)} ${(
              to.symbol || ""
            ).toUpperCase()}`;
      elements.summaryRate.textContent = rateText;
    }
    if (elements.summaryUpdated)
      elements.summaryUpdated.textContent = `Last updated: ${prettyTime(
        lastUpdated
      )}`;
  }

  /* -------------------------
     Currency pill UI updates
     ------------------------- */
  function updatePillsAndConvert() {
    const from = allCurrencies.find((c) => c.id === fromCurrency) || {
      symbol: "N/A",
      name: "Unknown",
      current_price: 0,
      type: "fiat",
    };
    const to = allCurrencies.find((c) => c.id === toCurrency) || {
      symbol: "N/A",
      name: "Unknown",
      current_price: 0,
      type: "fiat",
    };

    if (elements.fromFlag)
      elements.fromFlag.innerHTML = getCurrencyIconHTML(from);
    if (elements.toFlag) elements.toFlag.innerHTML = getCurrencyIconHTML(to);
    if (elements.fromCode)
      elements.fromCode.textContent = (
        from.symbol ||
        from.name ||
        ""
      ).toUpperCase();
    if (elements.toCode)
      elements.toCode.textContent = (to.symbol || to.name || "").toUpperCase();
    if (elements.fromPillValue)
      elements.fromPillValue.textContent = formatPrice(
        from.current_price,
        from
      );
    if (elements.toPillValue)
      elements.toPillValue.textContent = formatPrice(to.current_price, to);

    // update amount/result currency labels if you have them elsewhere
    // run conversion
    convertCurrency();
  }

  /* -------------------------
     Dropdown list build & filtering
     ------------------------- */
  function createCurrencyItem(currency, onClick) {
    const item = document.createElement("div");
    item.className = "currency-item item";
    item.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:34px;height:34px;border-radius:8px;overflow:hidden">${
          currency.type === "crypto" && currency.image
            ? `<img src="${currency.image}" alt="${currency.name}" style="width:100%;height:100%;object-fit:cover">`
            : currency.type === "fiat"
            ? (currency.symbol || "").toUpperCase()
            : "🔷"
        }</div>
        <div>
          <div style="font-weight:600">${currency.name}</div>
          <div style="font-size:12px;color:#94a3b8">${(
            currency.symbol || ""
          ).toUpperCase()}</div>
        </div>
      </div>
      <div style="font-weight:700">${formatPrice(
        currency.current_price,
        currency
      )}</div>
    `;
    item.addEventListener("click", () => onClick(currency));
    return item;
  }

  function updateCurrencyList(listElement, searchElement, type) {
    const searchTerm = (
      (searchElement && searchElement.value) ||
      ""
    ).toLowerCase();
    const filtered = allCurrencies.filter(
      (currency) =>
        currency.name.toLowerCase().includes(searchTerm) ||
        currency.symbol.toLowerCase().includes(searchTerm)
    );

    listElement.innerHTML = "";
    filtered.forEach((currency) => {
      const item = createCurrencyItem(currency, (selectedCurrency) => {
        if (type === "from") {
          fromCurrency = selectedCurrency.id;
        } else {
          toCurrency = selectedCurrency.id;
        }
        hideDropdown(type);
        // clear search box
        if (searchElement) searchElement.value = "";
        updatePillsAndConvert();
      });
      listElement.appendChild(item);
    });
  }

  function populateDropdowns() {
    if (!elements.fromCurrencyList || !elements.toCurrencyList) return;
    elements.fromCurrencyList.innerHTML = "";
    elements.toCurrencyList.innerHTML = "";
    const list = allCurrencies.slice();
    list.forEach((c) => {
      elements.fromCurrencyList.appendChild(
        createCurrencyItem(c, (sel) => {
          fromCurrency = sel.id;
          hideDropdown("from");
          updatePillsAndConvert();
        })
      );
      elements.toCurrencyList.appendChild(
        createCurrencyItem(c, (sel) => {
          toCurrency = sel.id;
          hideDropdown("to");
          updatePillsAndConvert();
        })
      );
    });
  }

  /* -------------------------
     show/hide dropdown (simple, pill-local absolute dropdown)
     ------------------------- */
  function showDropdown(type) {
    const menu =
      type === "from" ? elements.fromDropdownMenu : elements.toDropdownMenu;
    const pill = type === "from" ? elements.fromPill : elements.toPill;
    if (!menu || !pill) return;

    // close other dropdown
    if (type === "from" && elements.toDropdownMenu) hideDropdown("to");
    if (type === "to" && elements.fromDropdownMenu) hideDropdown("from");

    // update the list contents before showing (so search/filter is ready)
    updateCurrencyList(
      type === "from" ? elements.fromCurrencyList : elements.toCurrencyList,
      type === "from" ? elements.fromSearch : elements.toSearch,
      type
    );

    menu.classList.add("show"); // CSS (position:absolute) will display it directly under its pill
    pill.setAttribute("aria-expanded", "true");

    // focus search input if present
    setTimeout(() => {
      if (type === "from" && elements.fromSearch) elements.fromSearch.focus();
      if (type === "to" && elements.toSearch) elements.toSearch.focus();
    }, 60);
  }

  function hideDropdown(type) {
    const menu =
      type === "from" ? elements.fromDropdownMenu : elements.toDropdownMenu;
    const pill = type === "from" ? elements.fromPill : elements.toPill;
    if (!menu) return;
    menu.classList.remove("show");
    // ensure search box cleared (optional)
    if (type === "from" && elements.fromSearch) elements.fromSearch.value = "";
    if (type === "to" && elements.toSearch) elements.toSearch.value = "";
    if (pill) pill.setAttribute("aria-expanded", "false");
  }

  /* -------------------------
     Event wiring
     ------------------------- */
  function setupEventListeners() {
    // close error
    elements.closeError &&
      elements.closeError.addEventListener("click", () => {
        if (elements.errorDisplay)
          elements.errorDisplay.classList.add("hidden");
      });

    // refresh
    elements.refreshBtn &&
      elements.refreshBtn.addEventListener("click", updateAllCurrencies);

    // open dropdowns via the pill (note: we use pill-based markup now)
    if (elements.fromPill)
      elements.fromPill.addEventListener("click", (e) => {
        e.stopPropagation();
        showDropdown("from");
      });
    if (elements.toPill)
      elements.toPill.addEventListener("click", (e) => {
        e.stopPropagation();
        showDropdown("to");
      });

    // search inputs filter
    if (elements.fromSearch)
      elements.fromSearch.addEventListener("input", () =>
        updateCurrencyList(
          elements.fromCurrencyList,
          elements.fromSearch,
          "from"
        )
      );
    if (elements.toSearch)
      elements.toSearch.addEventListener("input", () =>
        updateCurrencyList(elements.toCurrencyList, elements.toSearch, "to")
      );

    // amount input auto-convert
    if (elements.amountInput)
      elements.amountInput.addEventListener("input", () => convertCurrency());

    // swap currencies
    if (elements.swapBtn)
      elements.swapBtn.addEventListener("click", () => {
        const tmp = fromCurrency;
        fromCurrency = toCurrency;
        toCurrency = tmp;
        updatePillsAndConvert();
      });

    // click outside to close dropdowns (uses .currency-dropdown wrapper in markup)
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".currency-dropdown")) {
        hideDropdown("from");
        hideDropdown("to");
      }
    });

    // esc to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hideDropdown("from");
        hideDropdown("to");
      }
    });
  }

  /* -------------------------
     Initialization
     ------------------------- */
  function init() {
    setupEventListeners();
    updateAllCurrencies();
    // refresh every minute
    setInterval(updateAllCurrencies, 60000);
  }

  // start
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();

  // export small helpers for debugging (optional)
  window._converterDebug = {
    showDropdown,
    hideDropdown,
    updateAllCurrencies,
    allCurrencies,
  };
})();
