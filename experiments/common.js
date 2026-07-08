/* common.js - 通用工具库 */
(function (global) {
    "use strict";

    // ---------- 存储模块 ----------
    const Storage = {
        saveFromInputs: function (appKey) {
            const inputs = document.querySelectorAll('.save-input');
            const data = {};
            inputs.forEach(input => {
                if (input.id) {
                    data[input.id] = input.value;
                }
            });
            localStorage.setItem(appKey, JSON.stringify(data));
            console.log(`[Storage] 数据已保存，key: ${appKey}`);
        },

        loadToInputs: function (appKey) {
            const saved = localStorage.getItem(appKey);
            if (!saved) return;
            try {
                const data = JSON.parse(saved);
                const inputs = document.querySelectorAll('.save-input');
                inputs.forEach(input => {
                    if (input.id && data[input.id] !== undefined) {
                        input.value = data[input.id];
                    }
                });
                console.log(`[Storage] 数据已加载，key: ${appKey}`);
            } catch (e) {
                console.warn('[Storage] 解析失败', e);
            }
        }
    };

    // ---------- 数据处理模块 ----------
    const Data = {
        mean: function (arr) {
            const valid = arr.filter(v => !isNaN(v));
            return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        },
        sum: function (arr) {
            return arr.filter(v => !isNaN(v)).reduce((a, b) => a + b, 0);
        },
        sumSquares: function (arr) {
            return arr.filter(v => !isNaN(v)).reduce((s, v) => s + v * v, 0);
        },
        sumProducts: function (arr1, arr2) {
            if (arr1.length !== arr2.length) throw new Error('数组长度不一致');
            let s = 0;
            for (let i = 0; i < arr1.length; i++) {
                if (!isNaN(arr1[i]) && !isNaN(arr2[i])) s += arr1[i] * arr2[i];
            }
            return s;
        },
        linearRegression: function (x, y) {
            const n = x.length;
            const x_mean = this.mean(x);
            const y_mean = this.mean(y);
            const sumX = this.sum(x);
            const sumY = this.sum(y);
            const sumXX = this.sumSquares(x);
            const sumYY = this.sumSquares(y);
            const sumXY = this.sumProducts(x, y);

            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = y_mean - slope * x_mean;

            const xVar = sumXX - sumX * sumX / n;
            const yVar = sumYY - sumY * sumY / n;
            const cov = sumXY - sumX * sumY / n;
            const r = (xVar * yVar) === 0 ? 0 : cov / Math.sqrt(xVar * yVar);

            return {
                slope, intercept, r,
                x_mean, y_mean,
                sumX, sumY, sumXX, sumYY, sumXY,
                n
            };
        },
        stdErrorOfMean: function (arr) {
            const valid = arr.filter(v => !isNaN(v));
            if (valid.length < 2) return 0;
            const m = this.mean(valid);
            const variance = valid.reduce((s, v) => s + (v - m) ** 2, 0) / (valid.length - 1);
            return Math.sqrt(variance / valid.length);
        }
    };

    // ---------- 键盘导航模块 ----------
    const KeyboardNav = {
        init: function (containerSelector, columnsCount) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const getInputs = () => [...container.querySelectorAll('input.cell-input')];

            const handleKeyDown = (e) => {
                const inputs = getInputs();
                const index = inputs.indexOf(e.target);
                if (index === -1) return;

                let targetIdx = -1;
                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault();
                        targetIdx = index - columnsCount;
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        targetIdx = index + columnsCount;
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        targetIdx = index - 1;
                        break;
                    case 'ArrowRight':
                    case 'Enter':
                        e.preventDefault();
                        targetIdx = index + 1;
                        break;
                    default:
                        return;
                }
                if (targetIdx >= 0 && targetIdx < inputs.length) {
                    inputs[targetIdx].focus();
                    inputs[targetIdx].select();
                }
            };

            container.addEventListener('keydown', handleKeyDown);
        }
    };


    // ---------- 深色模式 & GitHub 挂件管理 ----------
    const ThemeManager = {
        THEME_KEY: 'site-theme',
        REPO_PATH: 'w-Steve/BUAA-Physics-Labs',
        init: function () {
            const saved = localStorage.getItem(this.THEME_KEY);
            const isDark = saved === 'dark';
            if (isDark) {
                document.body.classList.add('dark-mode');
            }
            this.loadEditorialFonts();
            this.injectResponsiveOverrides();
            this.loadGithubLib();
            this.createHeaderWidgets(isDark);
            if (global.ExperimentUtils && global.ExperimentUtils.Community) {
                global.ExperimentUtils.Community.initExperimentPage();
            }
        },

        isExperimentPage: function () {
            return /\/\d+-\d+\.html$/.test(location.pathname.replace(/\\/g, '/'));
        },

        loadEditorialFonts: function () {
            if (document.getElementById('editorial-fonts')) return;
            const link = document.createElement('link');
            link.id = 'editorial-fonts';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Noto+Serif+SC:wght@400;500;600;700;900&display=swap';
            document.head.appendChild(link);
        },

        normalizeChartPlacement: function () {
            const processSection = document.getElementById('processSection');
            if (!processSection) return;

            const chartSection = document.getElementById('chartSection');
            if (chartSection && chartSection.nextElementSibling !== processSection) {
                processSection.parentNode.insertBefore(chartSection, processSection);
            }
        },

        injectResponsiveOverrides: function () {
            if (document.getElementById('responsive-overrides')) return;
            const style = document.createElement('style');
            style.id = 'responsive-overrides';
            style.textContent = `
                :root {
                    --editorial-bg: #f4f4f0;
                    --editorial-paper: #ffffff;
                    --editorial-ink: #050505;
                    --editorial-muted: #525252;
                    --editorial-line: #050505;
                    --editorial-shadow: 5px 5px 0 #050505;
                }

                body {
                    background: var(--editorial-bg) !important;
                    color: var(--editorial-ink) !important;
                    font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', 'SimSun', serif !important;
                }

                .container {
                    background: transparent !important;
                    box-shadow: none !important;
                    border-radius: 0 !important;
                }

                .page-title, .site-header, .header, .about-header {
                    border-bottom: 4px solid var(--editorial-line) !important;
                    color: var(--editorial-ink) !important;
                }

                .page-title, .site-header h1, .header h1, .about-header h1 {
                    color: var(--editorial-ink) !important;
                    font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', 'STSong', 'SimSun', serif !important;
                    font-weight: 900 !important;
                    letter-spacing: 0.02em !important;
                }

                .site-header p, .header p, .about-header p,
                .lesson-count, .experiment-meta, .community-summary {
                    color: var(--editorial-muted) !important;
                }

                [style*="#2563eb"], [style*="#5a67d8"],
                [style*="color: #2563eb"], [style*="color:#2563eb"] {
                    color: var(--editorial-ink) !important;
                    border-color: var(--editorial-line) !important;
                }

                .semester-tabs {
                    border-bottom: 2px solid var(--editorial-line);
                    padding-bottom: 0.8rem;
                }

                .lesson-card, .section, .tip-box, .result-card,
                .community-form, .community-review, .about-section,
                .data-table, .output-table, .chart-wrapper, .chart-wrap {
                    background: var(--editorial-paper) !important;
                    border: 2px solid var(--editorial-line) !important;
                    border-radius: 0 !important;
                    box-shadow: var(--editorial-shadow) !important;
                }

                .lesson-card, .section, .about-section {
                    margin-bottom: 1.25rem;
                }

                .lesson-header, .table-header, .output-table thead tr {
                    background: #efefe9 !important;
                    border-bottom: 2px solid var(--editorial-line) !important;
                }

                .lesson-title, .section-title, .step-title {
                    color: var(--editorial-ink) !important;
                    font-family: 'Noto Serif SC', 'Source Han Serif SC', 'Songti SC', serif !important;
                    font-weight: 700 !important;
                }

                .lesson-kicker, .experiment-meta, .community-review-top time,
                .theme-btn, button, .nav-link, .about-actions a {
                    font-family: 'JetBrains Mono', Consolas, monospace !important;
                }

                .experiment-rating-score {
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 0.18rem !important;
                    color: var(--editorial-ink) !important;
                    font-weight: 800 !important;
                }

                .experiment-rating-star {
                    width: 0.95em !important;
                    height: 0.95em !important;
                    display: inline-block !important;
                    fill: #facc15 !important;
                    stroke: var(--editorial-ink) !important;
                    stroke-width: 1.8 !important;
                    vertical-align: -0.1em !important;
                    flex: 0 0 auto !important;
                }

                .experiment-meta-separator {
                    margin: 0 0.36rem !important;
                    color: var(--editorial-muted) !important;
                }

                .community-review-top strong {
                    font-size: 1.05rem !important;
                    color: var(--editorial-ink) !important;
                }

                .community-count {
                    justify-self: end !important;
                    margin-top: -0.35rem !important;
                    color: var(--editorial-muted) !important;
                    font-family: 'JetBrains Mono', Consolas, monospace !important;
                    font-size: 0.85rem !important;
                    font-variant-numeric: tabular-nums !important;
                }

                .community-count.is-near-limit {
                    color: #d97706 !important;
                    font-weight: 800 !important;
                }

                .dark-mode .community-count.is-near-limit {
                    color: #facc15 !important;
                }

                .community-like {
                    margin-left: 0 !important;
                    padding: 0.35rem 0.65rem !important;
                    font-size: 0.85rem !important;
                    line-height: 1 !important;
                    display: inline-flex !important;
                    align-items: center !important;
                    gap: 0.35rem !important;
                    box-shadow: 2px 2px 0 var(--editorial-line) !important;
                }

                .community-like-icon {
                    width: 1rem !important;
                    height: 1rem !important;
                    fill: currentColor !important;
                    flex: 0 0 auto !important;
                }

                .community-like.is-liked {
                    background: #fff7d6 !important;
                    color: #b45309 !important;
                    font-weight: 800 !important;
                }

                .dark-mode .community-like.is-liked {
                    background: #332600 !important;
                    color: #facc15 !important;
                }

                .community-pager {
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    gap: 0.75rem !important;
                    margin-top: 1rem !important;
                }

                .community-pager span {
                    color: var(--editorial-muted) !important;
                    font-family: 'JetBrains Mono', Consolas, monospace !important;
                    font-size: 0.9rem !important;
                    font-variant-numeric: tabular-nums !important;
                }

                .star-wrapper {
                    display: inline-flex !important;
                    align-items: center !important;
                    min-height: 32px !important;
                }

                .dark-mode .star-wrapper::after {
                    background: #facc15 !important;
                    color: #111111 !important;
                    border: 2px solid #f4f4f0 !important;
                    box-shadow: 3px 3px 0 #f4f4f0 !important;
                }

                .experiment-item {
                    border-bottom: 1px solid #d7d7cf !important;
                }

                .experiment-item:hover {
                    background: #efefe9 !important;
                }

                .dark-mode .experiment-item:hover,
                .dark-mode .experiment-item:focus-within {
                    background: #332600 !important;
                    border-bottom-color: #facc15 !important;
                }

                .dark-mode .experiment-item:hover .experiment-link,
                .dark-mode .experiment-item:focus-within .experiment-link,
                .dark-mode .experiment-item:hover .experiment-meta,
                .dark-mode .experiment-item:focus-within .experiment-meta {
                    color: #f4f4f0 !important;
                }

                button, .theme-btn, .nav-link, .about-actions a {
                    background: transparent !important;
                    color: var(--editorial-ink) !important;
                    border: 2px solid var(--editorial-line) !important;
                    border-radius: 0 !important;
                    box-shadow: 3px 3px 0 var(--editorial-line) !important;
                    transition: transform 0.15s, box-shadow 0.15s, background-color 0.15s !important;
                }

                button:hover, .theme-btn:hover, .nav-link:hover, .about-actions a:hover {
                    background: #efefe9 !important;
                    transform: translate(2px, 2px);
                    box-shadow: 1px 1px 0 var(--editorial-line) !important;
                }

                .dark-mode button:hover,
                .dark-mode .theme-btn:hover,
                .dark-mode .nav-link:hover,
                .dark-mode .about-actions a:hover {
                    background: #facc15 !important;
                    color: #111111 !important;
                    border-color: #facc15 !important;
                    box-shadow: 1px 1px 0 #f4f4f0 !important;
                }

                .semester-tabs .tab.active {
                    background: #111111 !important;
                    color: #f4f4f0 !important;
                    border-color: #111111 !important;
                    box-shadow: 3px 3px 0 #d97706 !important;
                    transform: none !important;
                }

                .dark-mode .semester-tabs .tab.active {
                    background: #d97706 !important;
                    color: #111111 !important;
                    border-color: #f4f4f0 !important;
                    box-shadow: 3px 3px 0 #f4f4f0 !important;
                }

                button.primary {
                    background: var(--editorial-ink) !important;
                    color: var(--editorial-bg) !important;
                }

                input, textarea, .cell-input, .top-input input,
                .community-fields input, .community-fields textarea {
                    background: #fff !important;
                    color: var(--editorial-ink) !important;
                    border: 2px solid var(--editorial-line) !important;
                    border-radius: 0 !important;
                    box-shadow: none !important;
                }

                input::placeholder, textarea::placeholder {
                    color: #6b6b63 !important;
                    opacity: 1 !important;
                }

                .dark-mode input, .dark-mode textarea, .dark-mode .cell-input,
                .dark-mode .top-input input, .dark-mode .community-fields input,
                .dark-mode .community-fields textarea {
                    background: #111111 !important;
                    color: #f4f4f0 !important;
                    border-color: #f4f4f0 !important;
                    caret-color: #f4f4f0 !important;
                }

                .dark-mode input::placeholder,
                .dark-mode textarea::placeholder {
                    color: #a8a89e !important;
                }

                .community-star {
                    color: #d97706 !important;
                    background: #fff7d6 !important;
                    border: 2px solid #050505 !important;
                    box-shadow: 2px 2px 0 #050505 !important;
                    cursor: pointer !important;
                    font-family: 'JetBrains Mono', Consolas, monospace !important;
                }

                .community-star.active,
                .community-star:hover,
                .community-star:focus-visible {
                    color: #f59e0b !important;
                    background: #fff0a8 !important;
                    transform: translate(1px, 1px) !important;
                    box-shadow: 1px 1px 0 #050505 !important;
                }

                .dark-mode .community-star {
                    color: #fbbf24 !important;
                    background: #332600 !important;
                    border-color: #f4f4f0 !important;
                    box-shadow: 2px 2px 0 #f4f4f0 !important;
                }

                .dark-mode .community-star.active,
                .dark-mode .community-star:hover,
                .dark-mode .community-star:focus-visible {
                    color: #facc15 !important;
                    background: #4a3700 !important;
                    box-shadow: 1px 1px 0 #f4f4f0 !important;
                }

                .result-value {
                    color: var(--editorial-ink) !important;
                    font-family: 'JetBrains Mono', Consolas, monospace !important;
                    font-weight: 800 !important;
                }

                .step-result {
                    background: #efefe9 !important;
                    border-left-color: var(--editorial-line) !important;
                    color: var(--editorial-ink) !important;
                    border-radius: 0 !important;
                }

                mjx-container, .MathJax, .step-formula mjx-container {
                    background: transparent !important;
                    color: inherit !important;
                    border: 0 !important;
                    box-shadow: none !important;
                    outline: none !important;
                }

                .step-formula {
                    background: transparent !important;
                    color: var(--editorial-ink) !important;
                }

                table, .output-table, .lloyd-table, .data-table-grid {
                    border-collapse: collapse !important;
                    background: var(--editorial-paper) !important;
                    color: var(--editorial-ink) !important;
                }

                th, td, .output-table th, .output-table td,
                .lloyd-table th, .lloyd-table td,
                .data-table-grid th, .data-table-grid td {
                    border-color: var(--editorial-line) !important;
                }

                th, .output-table th, .lloyd-table th, .data-table-grid th {
                    background: #efefe9 !important;
                    color: var(--editorial-ink) !important;
                    font-weight: 800 !important;
                }

                .dark-mode table,
                .dark-mode .output-table,
                .dark-mode .lloyd-table,
                .dark-mode .data-table-grid {
                    background: var(--editorial-paper) !important;
                    color: var(--editorial-ink) !important;
                }

                .dark-mode th,
                .dark-mode .output-table th,
                .dark-mode .lloyd-table th,
                .dark-mode .data-table-grid th {
                    background: #292929 !important;
                    color: var(--editorial-ink) !important;
                }

                .dark-mode td,
                .dark-mode .output-table td,
                .dark-mode .lloyd-table td,
                .dark-mode .data-table-grid td {
                    background: var(--editorial-paper) !important;
                    color: var(--editorial-ink) !important;
                }

                .data-table table {
                    min-width: max-content;
                }

                .data-table th, .data-table td {
                    border: 1px solid var(--editorial-line) !important;
                    padding: 0.65rem 0.75rem !important;
                }

                .data-table td:has(.cell-input),
                .data-table-grid td:has(.cell-input),
                .lloyd-table td:has(.cell-input) {
                    padding: 0 !important;
                }

                .table-header,
                .table-row {
                    border-color: var(--editorial-line) !important;
                }

                .header-cell,
                .cell-input {
                    border-color: var(--editorial-line) !important;
                }

                .data-table .cell-input,
                .data-table-grid .cell-input,
                .lloyd-table .cell-input {
                    width: 100% !important;
                    min-width: 5rem !important;
                    height: 2.6rem !important;
                    border: 0 !important;
                    box-shadow: none !important;
                    background: transparent !important;
                    text-align: center !important;
                }

                .data-table .cell-input:focus,
                .data-table-grid .cell-input:focus,
                .lloyd-table .cell-input:focus {
                    outline: 3px solid #d97706 !important;
                    outline-offset: -3px !important;
                    background: #fff7d6 !important;
                }

                .dark-mode .data-table .cell-input:focus,
                .dark-mode .data-table-grid .cell-input:focus,
                .dark-mode .lloyd-table .cell-input:focus {
                    outline-color: #facc15 !important;
                    background: #332600 !important;
                    color: #f4f4f0 !important;
                }

                .dark-mode {
                    --editorial-bg: #111111;
                    --editorial-paper: #1c1c1c;
                    --editorial-ink: #f4f4f0;
                    --editorial-muted: #c9c9c0;
                    --editorial-line: #f4f4f0;
                    --editorial-shadow: 5px 5px 0 #f4f4f0;
                }

                .dark-mode .lesson-header,
                .dark-mode .table-header,
                .dark-mode .output-table thead tr,
                .dark-mode .step-result {
                    background: #292929 !important;
                }

                @media (max-width: 980px) {
                    .page-title, .site-header {
                        padding-top: 0 !important;
                        padding-right: 0 !important;
                    }
                    .star-wrapper {
                        display: inline-flex !important;
                    }
                    .theme-switch {
                        position: static !important;
                        width: 100% !important;
                        margin: 0 0 0.85rem !important;
                        display: flex !important;
                        flex-wrap: wrap !important;
                        justify-content: flex-start !important;
                        align-items: center !important;
                        gap: 0.45rem !important;
                    }
                    .theme-switch .theme-btn {
                        min-height: 2rem !important;
                        padding: 0.35rem 0.55rem !important;
                    }
                }

                @media (max-width: 768px) {
                    :root {
                        --title-mobile-size: 1.35rem;
                        --section-title-size: 1.08rem;
                        --body-size: 0.92rem;
                        --small-size: 0.82rem;
                    }

                    body { font-size: var(--body-size); }
                    .page-title, .site-header {
                        padding-top: 0 !important;
                        padding-right: 0 !important;
                    }
                    .page-title, .site-header h1 {
                        font-size: var(--title-mobile-size) !important;
                        line-height: 1.32 !important;
                    }
                    .section-title { font-size: var(--section-title-size) !important; }
                    button, .theme-btn, input, textarea, .cell-input {
                        font-size: var(--body-size) !important;
                    }
                    .tip-box, .mini-note, .angle-hint, .disclaimer, .result-label {
                        font-size: var(--small-size) !important;
                        line-height: 1.5 !important;
                    }
                    .data-table, .output-table-wrapper, .process-container, .step-formula,
                    .chart-wrapper, .chart-wrap {
                        overflow-x: auto !important;
                        -webkit-overflow-scrolling: touch;
                    }

                    .data-table {
                        max-width: 100% !important;
                    }
                    .chart-wrapper, .chart-wrap {
                        height: auto !important;
                        min-height: 300px !important;
                        padding: 0.75rem !important;
                        box-shadow: 3px 3px 0 var(--editorial-line) !important;
                    }
                    .chart-wrapper canvas, .chart-wrap canvas, canvas[width][height] {
                        display: block !important;
                        max-width: none !important;
                        width: auto !important;
                        height: auto !important;
                    }

                    canvas#graphChart,
                    canvas#chart {
                        min-width: 640px !important;
                    }
                    #fitChart {
                        min-width: 640px !important;
                        min-height: 300px !important;
                    }
                    mjx-container {
                        overflow-x: auto !important;
                        max-width: 100% !important;
                    }
                }
            `;
            document.head.appendChild(style);
        },

        loadGithubLib: function () {
            if (document.getElementById('github-buttons-script')) return;
            const script = document.createElement('script');
            script.id = 'github-buttons-script';
            script.async = true;
            script.defer = true;
            script.src = 'https://buttons.github.io/buttons.js';
            document.body.appendChild(script);
        },

        createHeaderWidgets: function (isDark) {
            const container = document.querySelector('.container');
            if (!container) return;

            const oldSwitch = document.querySelector('.theme-switch');
            if (oldSwitch) oldSwitch.remove();

            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'theme-switch'; // 复用你的 CSS 类名

            widgetDiv.innerHTML = `
                <span class="star-wrapper" data-tip="求求点个 Star">
                    <a class="github-button"
                       href="https://github.com/${this.REPO_PATH}"
                       data-icon="octicon-star"
                       data-size="large"
                       data-show-count="true"
                       aria-label="Star ${this.REPO_PATH} on GitHub">Star</a>
                </span>
                ${this.isExperimentPage() ? '<a class="theme-btn header-link" href="../index.html">返回</a>' : ''}
                <button id="theme-toggle" class="theme-btn" title="切换主题">
                    ${isDark ? '☀️ 浅色' : '🌙 深色'}
                </button>
            `;

            const header = container.querySelector('.page-title, .site-header, .header, .about-header');
            if (header && header.parentNode === container) {
                header.insertAdjacentElement('afterend', widgetDiv);
            } else {
                container.prepend(widgetDiv);
            }

            document.getElementById('theme-toggle').addEventListener('click', (e) => {
                const isNowDark = document.body.classList.toggle('dark-mode');
                localStorage.setItem(this.THEME_KEY, isNowDark ? 'dark' : 'light');
                e.target.innerHTML = isNowDark ? '☀️ 浅色' : '🌙 深色';
            });

            if (global.GitHubButtons) {
                global.GitHubButtons.render(widgetDiv);
            }
        }
    };

    // ---------- 动态表格生成器 ----------
    const TableGenerator = {
        /**
         * 生成一个数据输入表格
         * @param {string} containerId - 放置表格的容器ID
         * @param {object} config - 配置 { rows, cols, rowHeaders, colHeaders, prefix, defaultValues }
         */
        generateInputTable: function (containerId, config) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const { rows = 1, cols = 10, rowHeaders = [], colHeaders = [], prefix = 'L', defaultValues = [] } = config;

            // 清空容器
            container.innerHTML = '';

            // 创建表格结构 (使用flex布局，保持原有样式)
            const tableDiv = document.createElement('div');
            tableDiv.className = 'data-table';

            // 表头
            if (colHeaders.length > 0) {
                const headerRow = document.createElement('div');
                headerRow.className = 'table-header';
                colHeaders.forEach(text => {
                    const cell = document.createElement('div');
                    cell.className = 'header-cell';
                    cell.textContent = text;
                    headerRow.appendChild(cell);
                });
                tableDiv.appendChild(headerRow);
            }

            // 数据行
            for (let r = 0; r < rows; r++) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'table-row';

                // 行首（如果需要）
                if (rowHeaders[r]) {
                    const headerCell = document.createElement('div');
                    headerCell.className = 'header-cell';
                    headerCell.textContent = rowHeaders[r];
                    rowDiv.appendChild(headerCell);
                }

                for (let c = 0; c < cols; c++) {
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.step = '0.001';
                    input.className = 'cell-input save-input';  // save-input 用于存储
                    const idx = r * cols + c;
                    input.id = `${prefix}${idx + 1}`;  // 生成 L1, L2, ...
                    // 设置默认值
                    if (defaultValues[idx] !== undefined) {
                        input.value = defaultValues[idx];
                    } else {
                        input.value = '';
                    }
                    rowDiv.appendChild(input);
                }
                tableDiv.appendChild(rowDiv);
            }

            container.appendChild(tableDiv);
        }
    };

    function formatResultWithUncertainty(value, uncertainty, asObject = false) {
        // 处理非法输入
        if (typeof value !== 'number' || !isFinite(value) ||
            typeof uncertainty !== 'number' || !isFinite(uncertainty) || uncertainty <= 0) {
            return asObject ? { value: value?.toString() || '—', uncertainty: '—' } : [value?.toString() || '—', '—'];
        }

        // 计算不确定度的数量级和第一位有效数字
        const magnitude = Math.floor(Math.log10(uncertainty));
        const factor = Math.pow(10, magnitude);
        const firstDigit = Math.round(uncertainty / factor); // 第一位有效数字（四舍五入）

        // 保留一位有效数字的不确定度
        let roundedUnc = firstDigit * factor;

        // 对齐：确定测量值应保留的小数位数（与 roundedUnc 末位一致）
        const decimalPlaces = Math.max(0, -Math.floor(Math.log10(roundedUnc)));
        const roundedValue = parseFloat(value.toFixed(decimalPlaces));

        const valueStr = roundedValue.toFixed(decimalPlaces);
        const uncStr = roundedUnc.toFixed(decimalPlaces);

        return asObject ? { value: valueStr, uncertainty: uncStr } : [valueStr, uncStr];
    }

    // ---------- LaTeX渲染辅助 ----------
    async function renderMath(element) {
        if (global.MathJax) {
            try {
                await global.MathJax.typesetPromise([element]);
            } catch (err) {
                console.warn('MathJax渲染失败', err);
            }
        }
    }

    // ---------- Community rating and comments ----------
    const Community = {
        CONFIG: {
            supabaseUrl: 'https://dijmvqwzkkyrnpiyzaku.supabase.co',
            supabaseAnonKey: 'sb_publishable_Tklb1p241xkiHa8PgrDVwQ_TkkhN3L0',
            reviewCooldownMs: 10000,
            commentsPageSize: 10
        },

        getConfig: function () {
            return Object.assign({}, this.CONFIG, global.COMMUNITY_CONFIG || {});
        },

        isConfigured: function () {
            const config = this.getConfig();
            return /^https:\/\/.+\.supabase\.co\/?$/.test(config.supabaseUrl)
                && config.supabaseAnonKey
                && !config.supabaseUrl.includes('YOUR_PROJECT_REF')
                && !config.supabaseAnonKey.includes('YOUR_SUPABASE');
        },

        request: async function (path, options = {}) {
            const config = this.getConfig();
            const baseUrl = config.supabaseUrl.replace(/\/$/, '');
            const headers = Object.assign({
                apikey: config.supabaseAnonKey,
                Authorization: `Bearer ${config.supabaseAnonKey}`,
                'Content-Type': 'application/json'
            }, options.headers || {});

            const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
                method: options.method || 'GET',
                headers,
                body: options.body
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || `Community request failed: ${response.status}`);
            }

            if (response.status === 204) return null;
            const text = await response.text();
            return text ? JSON.parse(text) : null;
        },

        escapeHTML: function (value) {
            return String(value || '').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]));
        },

        formatDate: function (value) {
            if (!value) return '';
            try {
                return new Intl.DateTimeFormat('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(new Date(value));
            } catch (err) {
                return '';
            }
        },

        getExperimentId: function () {
            const match = location.pathname.match(/\/([^\/]+)\.html$/);
            if (!match) return '';
            const id = decodeURIComponent(match[1]);
            return /^\d+-\d+$/.test(id) ? id : '';
        },

        getCommentPageId: function () {
            if (/\/about\.html$/.test(location.pathname.replace(/\\/g, '/'))) {
                return 'about';
            }
            return this.getExperimentId();
        },

        ratingStarIcon: function () {
            return `
                <svg class="experiment-rating-star" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path d="M12 2.8 14.9 8.7l6.5.9-4.7 4.6 1.1 6.5L12 17.6l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.8Z"></path>
                </svg>
            `;
        },

        formatSummary: function (stat) {
            const ratingCount = stat ? Number(stat.rating_count || 0) : 0;
            const commentCount = stat ? Number(stat.comment_count || 0) : 0;
            if (!ratingCount) {
                return `暂无评分 · ${commentCount} 条评论`;
            }
            const average = Number(stat.average_rating || 0).toFixed(1);
            return `<span class="experiment-rating-score">${average}${this.ratingStarIcon()}</span><span class="experiment-meta-separator">·</span>${commentCount} 条评论`;
        },

        loadIndexStats: async function () {
            const targets = [...document.querySelectorAll('[data-rating-summary]')];
            if (!targets.length) return;

            if (!this.isConfigured()) {
                targets.forEach(target => target.textContent = '暂无评分');
                return;
            }

            try {
                const stats = await this.request('experiment_rating_stats?select=experiment_id,average_rating,rating_count,comment_count');
                const statMap = new Map(stats.map(stat => [stat.experiment_id, stat]));
                targets.forEach(target => {
                    target.innerHTML = this.formatSummary(statMap.get(target.dataset.expId));
                });
            } catch (err) {
                console.warn('[Community] Failed to load index stats', err);
                targets.forEach(target => target.textContent = '评分加载失败');
            }
        },

        initExperimentPage: function () {
            const experimentId = this.getCommentPageId();
            const commentOnly = experimentId === 'about';
            const container = document.querySelector('.container');
            if (!experimentId || !container || document.getElementById('community-section')) return;

            const ratingFormHTML = commentOnly ? '' : `
                <form class="community-form community-rating-form" data-rating-form>
                    <div class="community-form-title">匿名打分</div>
                    <div class="community-rating" role="radiogroup" aria-label="评分">
                        ${[1, 2, 3, 4, 5].map(value => `
                            <button type="button" class="community-star" data-rating="${value}" aria-label="${value} 星">&#9734;</button>
                        `).join('')}
                    </div>
                    <div class="community-actions">
                        <span class="community-status" data-rating-status></span>
                        <button type="submit" class="primary">提交评分</button>
                    </div>
                </form>
            `;

            const section = document.createElement('section');
            section.id = 'community-section';
            section.className = 'section community-section';
            section.innerHTML = `
                <div class="community-head">
                    <div>
                        <div class="section-title">${commentOnly ? '评论区' : '社区评价'}</div>
                        ${commentOnly ? '' : '<div class="community-summary" data-community-summary>暂无评分</div>'}
                    </div>
                </div>
                ${ratingFormHTML}
                <form class="community-form community-comment-form" data-comment-form>
                    <div class="community-form-title">评论</div>
                    <div class="community-fields">
                        <input type="text" name="nickname" maxlength="24" placeholder="昵称" autocomplete="nickname">
                        <textarea name="content" maxlength="200" rows="3" placeholder="写一点经验、提醒或问题（200字以内）"></textarea>
                        <div class="community-count" data-comment-count>0/200</div>
                    </div>
                    <div class="community-actions">
                        <span class="community-status" data-comment-status></span>
                        <button type="submit" class="primary">提交评论</button>
                    </div>
                </form>
                <div class="community-list" data-community-list></div>
                <div class="community-pager" data-community-pager></div>
            `;

            const disclaimer = container.querySelector('.disclaimer');
            if (disclaimer) {
                container.insertBefore(section, disclaimer);
            } else {
                container.appendChild(section);
            }

            this.bindExperimentForm(section, experimentId);
            this.loadExperimentCommunity(experimentId, section);
        },

        bindExperimentForm: function (section, experimentId) {
            let selectedRating = 4;
            const stars = [...section.querySelectorAll('.community-star')];
            const ratingStatus = section.querySelector('[data-rating-status]');
            const commentStatus = section.querySelector('[data-comment-status]');
            const ratingForm = section.querySelector('[data-rating-form]');
            const commentForm = section.querySelector('[data-comment-form]');
            const nicknameInput = commentForm.querySelector('input[name="nickname"]');
            const contentInput = commentForm.querySelector('textarea[name="content"]');
            const commentCount = commentForm.querySelector('[data-comment-count]');
            const commentList = section.querySelector('[data-community-list]');
            const commentPager = section.querySelector('[data-community-pager]');
            nicknameInput.value = localStorage.getItem('community-nickname') || '';

            const updateCommentCount = () => {
                if (!commentCount || !contentInput) return;
                commentCount.textContent = `${contentInput.value.length}/200`;
                commentCount.classList.toggle('is-near-limit', contentInput.value.length >= 180);
            };
            if (contentInput) {
                contentInput.addEventListener('input', updateCommentCount);
                updateCommentCount();
            }

            const paintStars = () => {
                stars.forEach(star => {
                    const value = Number(star.dataset.rating);
                    star.textContent = value <= selectedRating ? '\u2605' : '\u2606';
                    star.classList.toggle('active', value <= selectedRating);
                });
            };

            if (ratingForm) {
                stars.forEach(star => {
                    star.addEventListener('click', () => {
                        selectedRating = Number(star.dataset.rating);
                        paintStars();
                    });
                });
                paintStars();

                ratingForm.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    if (!this.isConfigured()) {
                        ratingStatus.textContent = '请先在 common.js 中填写 Supabase 配置';
                        return;
                    }

                    const lastSubmitKey = `community-last-rating-${experimentId}`;
                    const lastSubmit = Number(localStorage.getItem(lastSubmitKey) || 0);
                    const config = this.getConfig();
                    if (Date.now() - lastSubmit < config.reviewCooldownMs) {
                        ratingStatus.textContent = '提交太快了，稍等一下再试';
                        return;
                    }

                    ratingStatus.textContent = '提交中...';
                    try {
                        await this.request('ratings', {
                            method: 'POST',
                            headers: { Prefer: 'return=minimal' },
                            body: JSON.stringify({
                                experiment_id: experimentId,
                                rating: selectedRating,
                                status: 'visible'
                            })
                        });
                        localStorage.setItem(lastSubmitKey, String(Date.now()));
                        selectedRating = 4;
                        paintStars();
                        ratingStatus.textContent = '评分已提交';
                        await this.loadExperimentCommunity(experimentId, section);
                } catch (err) {
                    console.warn('[Community] Failed to submit rating', err);
                    ratingStatus.textContent = String(err.message || err).includes('rate_limited')
                        ? '发送太快了，稍等一下再试'
                        : '评分提交失败，请稍后再试';
                }
            });
            }

            commentList.addEventListener('click', async (event) => {
                const likeButton = event.target.closest('[data-comment-like]');
                if (!likeButton) return;
                const commentId = likeButton.dataset.commentLike;
                const likedKey = `community-liked-${commentId}`;
                if (localStorage.getItem(likedKey)) {
                    likeButton.classList.add('is-liked');
                    return;
                }
                likeButton.disabled = true;
                try {
                    const result = await this.request('rpc/like_comment', {
                        method: 'POST',
                        body: JSON.stringify({ target_comment_id: commentId })
                    });
                    localStorage.setItem(likedKey, '1');
                    likeButton.classList.add('is-liked');
                    likeButton.querySelector('[data-like-count]').textContent = Number(result || 0);
                    await this.loadExperimentCommunity(experimentId, section);
                } catch (err) {
                    console.warn('[Community] Failed to like comment', err);
                } finally {
                    likeButton.disabled = false;
                }
            });

            commentPager.addEventListener('click', (event) => {
                const pageButton = event.target.closest('[data-comment-page]');
                if (!pageButton) return;
                section.dataset.commentPage = String(Math.max(0, Number(pageButton.dataset.commentPage || 0)));
                this.loadExperimentCommunity(experimentId, section);
            });

            commentForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                if (!this.isConfigured()) {
                    commentStatus.textContent = '请先在 common.js 中填写 Supabase 配置';
                    return;
                }

                const lastSubmitKey = `community-last-comment-${experimentId}`;
                const lastSubmit = Number(localStorage.getItem(lastSubmitKey) || 0);
                const config = this.getConfig();
                if (Date.now() - lastSubmit < config.reviewCooldownMs) {
                    commentStatus.textContent = '提交太快了，稍等一下再试';
                    return;
                }

                const formData = new FormData(commentForm);
                const nickname = String(formData.get('nickname') || '匿名同学').trim().slice(0, 24) || '匿名同学';
                const content = String(formData.get('content') || '').trim().slice(0, 200);
                if (!content) {
                    commentStatus.textContent = '先写点内容再提交';
                    return;
                }

                commentStatus.textContent = '提交中...';
                try {
                    await this.request('comments', {
                        method: 'POST',
                        headers: { Prefer: 'return=minimal' },
                        body: JSON.stringify({
                            experiment_id: experimentId,
                            nickname,
                            content,
                            status: 'visible'
                        })
                    });
                    localStorage.setItem(lastSubmitKey, String(Date.now()));
                    localStorage.setItem('community-nickname', nickname);
                    contentInput.value = '';
                    updateCommentCount();
                    nicknameInput.value = nickname;
                    section.dataset.commentPage = '0';
                    commentStatus.textContent = '评论已提交';
                    await this.loadExperimentCommunity(experimentId, section);
                } catch (err) {
                    console.warn('[Community] Failed to submit comment', err);
                    commentStatus.textContent = String(err.message || err).includes('rate_limited')
                        ? '发送太快了，稍等一下再试'
                        : '评论提交失败，请稍后再试';
                }
            });
        },

        loadExperimentCommunity: async function (experimentId, section) {
            const summary = section.querySelector('[data-community-summary]');
            const list = section.querySelector('[data-community-list]');
            const pager = section.querySelector('[data-community-pager]');
            const config = this.getConfig();
            const pageSize = Number(config.commentsPageSize || 10);
            const page = Math.max(0, Number(section.dataset.commentPage || 0));
            const offset = page * pageSize;

            if (!this.isConfigured()) {
                if (summary) summary.textContent = '配置 Supabase 后启用评分和评论';
                list.innerHTML = '<div class="community-empty">当前为本地预览模式，尚未连接评论数据库。</div>';
                if (pager) pager.innerHTML = '';
                return;
            }

            try {
                const [stats, commentsRaw] = await Promise.all([
                    this.request(`experiment_rating_stats?select=experiment_id,average_rating,rating_count,comment_count&experiment_id=eq.${encodeURIComponent(experimentId)}`),
                    this.request(`visible_comments?select=id,nickname,content,likes_count,created_at&experiment_id=eq.${encodeURIComponent(experimentId)}&order=likes_count.desc,created_at.desc&limit=${pageSize + 1}&offset=${offset}`)
                ]);

                const comments = commentsRaw.slice(0, pageSize);
                const hasNext = commentsRaw.length > pageSize;
                if (summary) summary.textContent = this.formatSummary(stats[0]);
                if (!comments.length) {
                    list.innerHTML = page
                        ? '<div class="community-empty">这一页暂时没有评论。</div>'
                        : '<div class="community-empty">还没有评论，来留下第一条经验。</div>';
                    if (pager) {
                        pager.innerHTML = page > 0
                            ? `<button type="button" data-comment-page="${page - 1}">上一页</button><span>${page + 1}</span><button type="button" disabled>下一页</button>`
                            : '';
                    }
                    return;
                }

                list.innerHTML = comments.map(comment => {
                    const liked = localStorage.getItem(`community-liked-${comment.id}`) ? ' is-liked' : '';
                    return `
                    <article class="community-review">
                        <div class="community-review-top">
                            <strong>${this.escapeHTML(comment.nickname)}</strong>
                            <time>${this.formatDate(comment.created_at)}</time>
                            <button type="button" class="community-like${liked}" data-comment-like="${comment.id}">
                                <svg class="community-like-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                    <path d="M7 10v10H4V10h3Zm3.2 10c-.9 0-1.7-.7-1.7-1.7v-7.1c0-.4.1-.8.4-1.1l4.6-5.6c.4-.5 1.2-.2 1.2.4v4.4h4.1c1.2 0 2.1 1.1 1.8 2.3l-1.5 6.8c-.2.9-1 1.6-1.9 1.6h-7Z"/>
                                </svg>
                                <span data-like-count>${Number(comment.likes_count || 0)}</span>
                            </button>
                        </div>
                        <p>${this.escapeHTML(comment.content)}</p>
                    </article>
                    `;
                }).join('');
                if (pager) {
                    pager.innerHTML = `
                        <button type="button" data-comment-page="${page - 1}" ${page <= 0 ? 'disabled' : ''}>上一页</button>
                        <span>${page + 1}</span>
                        <button type="button" data-comment-page="${page + 1}" ${hasNext ? '' : 'disabled'}>下一页</button>
                    `;
                }
            } catch (err) {
                console.warn('[Community] Failed to load comments', err);
                if (summary) summary.textContent = '评论加载失败';
                list.innerHTML = '<div class="community-empty">评论暂时加载失败。</div>';
                if (pager) pager.innerHTML = '';
            }
        }
    };


    // 暴露公共接口
    global.ExperimentUtils = {
        Storage,
        Data,
        KeyboardNav,
        ThemeManager,
        TableGenerator,
        Community,
        renderMath,
        formatResultWithUncertainty
    };

})(window);
