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
            this.loadGithubLib();
            this.createHeaderWidgets(isDark);
        },

        loadGithubLib: function () {
            if (!document.getElementById('github-btns-src')) {
                const script = document.createElement('script');
                script.id = 'github-btns-src';
                script.async = true;
                script.defer = true;
                script.src = "https://buttons.github.io/buttons.js";
                document.head.appendChild(script);
            }
        },

        createHeaderWidgets: function (isDark) {
            const container = document.querySelector('.container');
            if (!container) return;

            const oldSwitch = document.querySelector('.theme-switch');
            if (oldSwitch) oldSwitch.remove();

            const widgetDiv = document.createElement('div');
            widgetDiv.className = 'theme-switch'; // 复用你的 CSS 类名

            widgetDiv.innerHTML = `
                <div class="star-wrapper" data-tip="觉得好用点个 Star 呀 ⭐">
                    <a class="github-button" 
                       href="https://github.com/${this.REPO_PATH}" 
                       data-icon="octicon-star" 
                       data-show-count="true" 
                       aria-label="Star on GitHub">Star</a>
                </div>
                <button id="theme-toggle" class="theme-btn" title="切换主题">
                    ${isDark ? '☀️ 浅色' : '🌙 深色'}
                </button>
            `;

            container.prepend(widgetDiv);

            document.getElementById('theme-toggle').addEventListener('click', (e) => {
                const isNowDark = document.body.classList.toggle('dark-mode');
                localStorage.setItem(this.THEME_KEY, isNowDark ? 'dark' : 'light');
                e.target.innerHTML = isNowDark ? '☀️ 浅色' : '🌙 深色';
            });
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


    // 暴露公共接口
    global.ExperimentUtils = {
        Storage,
        Data,
        KeyboardNav,
        ThemeManager,
        TableGenerator,
        renderMath,
        formatResultWithUncertainty
    };

})(window);