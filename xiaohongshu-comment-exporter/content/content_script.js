(function() {
    // 确保脚本只运行一次
    if (window.hasRun) {
        return;
    }
    window.hasRun = true;

    let commentsData = [];

    // 1. 创建并注入UI面板
    function createUIPanel() {
        const panel = document.createElement('div');
        panel.id = 'xhs-exporter-panel';
        panel.innerHTML = `
            <h3>小红书评论抓取助手</h3>
            <div class="status-bar" id="status-bar">准备就绪</div>
            
            <div class="section-title">笔记总览</div>
            <div class="note-overview" id="note-overview">
                <div>点赞: <span id="total-likes">...</span></div>
                <div>收藏: <span id="total-collects">...</span></div>
                <div>评论: <span id="total-comments">...</span></div>
            </div>

            <div class="section-title">抓取统计</div>
            <div class="stats">
                <div class="stat-item">
                    <div class="value" id="comment-count">0</div>
                    <div class="label">已抓取</div>
                </div>
                <div class="stat-item">
                    <div class="value" id="max-likes">0</div>
                    <div class="label">最高点赞</div>
                </div>
            </div>

            <div class="section-title">热门评论</div>
            <div class="top-comment" id="top-comment">暂无</div>

            <button id="scrape-btn">自动抓取所有评论</button>
            <button id="export-btn" disabled>导出数据 (JSON)</button>
            <div class="progress-log" id="progress-log"></div>
        `;
        document.body.appendChild(panel);

        // 添加事件监听
        document.getElementById('scrape-btn').addEventListener('click', handleScrapeClick);
        document.getElementById('export-btn').addEventListener('click', handleExportClick);
    }

    // 2. "自动抓取所有评论" 按钮的点击处理函数 (最终版)
    async function handleScrapeClick() {
        const scrapeBtn = document.getElementById('scrape-btn');
        const exportBtn = document.getElementById('export-btn');
        
        logToPanel('开始全自动抓取...');
        updateStatus('抓取中，请勿操作页面...', 'info');
        scrapeBtn.disabled = true;
        scrapeBtn.textContent = '抓取中...';
        exportBtn.disabled = true;
        
        // 重置数据和标记
        commentsData = [];
        document.querySelectorAll('[data-scraped="true"]').forEach(el => el.removeAttribute('data-scraped'));

        try {
            // 首先抓取一次笔记总览数据
            captureNoteOverview();

            let lastCommentCount = -1;
            let retries = 0;
            const MAX_RETRIES = 3;

            while (true) {
                let newCommentsFound = parseAndAddNewComments();
                updateStatistics();

                // 尝试展开所有“查看更多”的回复
                const expandedSomething = await expandAllReplies();
                if (expandedSomething) {
                    logToPanel('成功展开回复，等待1.5秒后将重新解析...');
                    await new Promise(r => setTimeout(r, 1500));
                    newCommentsFound += parseAndAddNewComments();
                    updateStatistics();
                }

                const scrolled = await scrollDown();
                
                // 结束条件的判断 (V3 - 最终版)
                // 结合“滚动到底”和“评论数量不再增加”来判断
                if (!scrolled) {
                    logToPanel('已滚动到底部。正在进行最后检查...');
                    
                    // 滚动到底后，进行最后一次、更彻底的检查
                    for (let i = 0; i < 3; i++) {
                        const expandedAfterScroll = await expandAllReplies();
                        if (expandedAfterScroll) {
                            logToPanel(`[最终检查 ${i+1}/3] 展开了新的回复，等待2秒后重新解析...`);
                            await new Promise(r => setTimeout(r, 2000));
                            parseAndAddNewComments();
                            updateStatistics();
                        } else {
                            logToPanel(`[最终检查 ${i+1}/3] 未发现可展开的回复。`);
                            break; // 如果一轮检查没发现任何可展开的，就没必要再试了
                        }
                    }

                    if (commentsData.length === lastCommentCount) {
                        logToPanel('滚动到底且评论数量不再增加，认定抓取结束。');
                        break;
                    }
                }

                if (commentsData.length === lastCommentCount) {
                    retries++;
                    logToPanel(`滚动后评论数量未变，第 ${retries}/${MAX_RETRIES} 次尝试...`);
                    if (retries >= MAX_RETRIES) {
                        logToPanel(`连续 ${MAX_RETRIES} 次未发现新评论，认定抓取结束。`);
                        break;
                    }
                } else {
                    retries = 0; // 只要有新评论，就重置计数器
                }
                
                lastCommentCount = commentsData.length;
                logToPanel(`已抓取 ${lastCommentCount} 条，继续向下滚动...`);

                if (scrolled) {
                    await new Promise(r => setTimeout(r, 1500)); // 每次滚动后等待加载
                } else if (!expandedSomething) {
                    // 如果既不能滚动，也没有展开任何东西，就结束
                    logToPanel('无法滚动且无内容可展开，抓取结束。');
                    break;
                }
            }

            logToPanel(`全自动抓取完成！共找到 ${commentsData.length} 条评论。`);
            updateStatus(`抓取成功！共获取 ${commentsData.length} 条评论。`, 'success');

            if (commentsData.length > 0) {
                exportBtn.disabled = false;
            }

        } catch (error) {
            console.error('抓取过程中发生错误:', error);
            logToPanel(`错误: ${error.message}`);
            updateStatus('抓取失败，请查看控制台日志。', 'error');
        } finally {
            scrapeBtn.disabled = false;
            scrapeBtn.textContent = '重新开始抓取';
        }
    }

    // 2.1 智能滚动函数
    function scrollDown() {
        return new Promise((resolve) => {
            // 尝试找到小红书的特定滚动容器，这是最关键的修复
            const scrollableElement = document.querySelector('.note-scroller');
            
            let targetElement = scrollableElement || window;
            let currentScroll = scrollableElement ? scrollableElement.scrollTop : window.scrollY;
            let scrollHeight = scrollableElement ? scrollableElement.scrollHeight : document.body.scrollHeight;

            if (currentScroll + (scrollableElement ? scrollableElement.clientHeight : window.innerHeight) >= scrollHeight - 10) {
                // 如果已经接近底部，则认为无法再滚动
                return resolve(false);
            }

            targetElement.scrollTo({ top: scrollHeight, behavior: 'smooth' });
            
            setTimeout(() => {
                resolve(true);
            }, 1500); // 增加延迟以确保内容有足够时间加载
        });
    }

    // 2.2 解析并添加新评论 (V3 - 重构版，支持主评论和子评论)
        function parseAndAddNewComments() {
            let totalNewComments = 0;
            // 遍历所有“评论家族”容器，但只处理未被标记的
            const parentCommentElements = document.querySelectorAll('.parent-comment:not([data-scraped="true"])');
    
            logToPanel(`发现 ${parentCommentElements.length} 个未处理的评论家族...`);
    
            parentCommentElements.forEach((parentEl, index) => {
                try {
                    // 1. 解析主评论
                    const mainCommentEl = parentEl.querySelector('.comment-item:not(.comment-item-sub)');
                    if (mainCommentEl) {
                        const comment = parseSingleComment(mainCommentEl, 'main');
                        if (comment) {
                            commentsData.push(comment);
                            totalNewComments++;
                        }
                    }
    
                    // 2. 解析该家族下的所有子评论
                    const subCommentElements = parentEl.querySelectorAll('.comment-item.comment-item-sub');
                    subCommentElements.forEach(subEl => {
                        const subComment = parseSingleComment(subEl, 'sub');
                        if (subComment) {
                            commentsData.push(subComment);
                            totalNewComments++;
                        }
                    });
    
                    // 标记整个“评论家族”为已处理，避免重复
                    parentEl.dataset.scraped = 'true';
    
                } catch (e) {
                    logToPanel(`处理第 ${index + 1} 个评论家族时出错: ${e.message}`);
                    parentEl.dataset.scraped = 'true'; // 出错也标记，防死循环
                }
            });
            
            logToPanel(`本次解析新增 ${totalNewComments} 条评论。`);
            return totalNewComments;
        }
    // 2.2.2 展开所有折叠的回复
    async function expandAllReplies() {
        const expandButtons = document.querySelectorAll('.parent-comment .show-more');
        if (expandButtons.length === 0) {
            return false; // 没有找到可展开的按钮
        }

        logToPanel(`发现 ${expandButtons.length} 个“展开回复”按钮，正在尝试点击...`);
        let clickedSomething = false;

        for (const button of expandButtons) {
            try {
                button.click();
                clickedSomething = true;
                // 等待一小段时间让内容加载
                await new Promise(r => setTimeout(r, 500));
            } catch (e) {
                logToPanel(`点击“展开回复”按钮时出错: ${e.message}`);
            }
        }

        return clickedSomething;
    }

    
        // 2.2.1 单个评论解析函数 (主、子评论共用)
        function parseSingleComment(element, type) {
            try {
                const userName = element.querySelector('.author .name')?.innerText.trim() || '未知用户';
                const content = element.querySelector('.content .note-text')?.innerText.trim() || '';
                const time = element.querySelector('.info .date')?.innerText.trim() || '未知时间';
                const location = element.querySelector('.info .location')?.innerText.trim() || '未知属地';
                
                let likesText = element.querySelector('.like .count')?.innerText.trim() || '0';
                if (likesText === '赞') likesText = '0'; // 处理“赞”字样
                const likes = parseInt(likesText.replace(/万/g, '0000').match(/\d+/)?.[0] || '0', 10);
    
                return {
                    userName,
                    content,
                    likes,
                    time,
                    location,
                    type // 'main' or 'sub'
                };
            } catch (e) {
                logToPanel(`解析单个${type}评论时出错: ${e.message}`);
                return null;
            }
        }

    // 3. "导出数据" 按钮的点击处理函数
    function handleExportClick() {
        if (commentsData.length === 0) {
            updateStatus('没有数据可导出。', 'error');
            return;
        }

        logToPanel('正在生成JSON文件...');
        
        try {
            // 导出前按点赞数排序
            commentsData.sort((a, b) => b.likes - a.likes);
            
            const jsonData = JSON.stringify(commentsData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8,' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const noteIdMatch = window.location.pathname.match(/\/explore\/([a-zA-Z0-9]+)/);
            const noteId = noteIdMatch ? noteIdMatch[1] : 'unknown-note';
            
            a.href = url;
            a.download = `xiaohongshu-comments-${noteId}-${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            logToPanel('JSON文件已成功触发下载!');
            updateStatus('导出成功！', 'success');
        } catch (error) {
            console.error('导出数据时发生错误:', error);
            logToPanel(`导出错误: ${error.message}`);
            updateStatus('导出失败!', 'error');
        }
    }

    // 4. 更新统计数据
    function updateStatistics() {
        const count = commentsData.length;
        document.getElementById('comment-count').textContent = count;

        if (count > 0) {
            const likes = commentsData.map(c => c.likes || 0);
            const maxLikes = Math.max(...likes);
            document.getElementById('max-likes').textContent = maxLikes;

            // 更新热门评论
            const topComment = commentsData.reduce((prev, current) => (prev.likes > current.likes) ? prev : current);
            const topCommentDiv = document.getElementById('top-comment');
            topCommentDiv.innerHTML = `
                <strong>${topComment.userName} (${topComment.likes}赞):</strong>
                <p>${topComment.content}</p>
            `;
        }
    }
    
    // 5. 在面板上打印日志
    function logToPanel(message) {
        const logContainer = document.getElementById('progress-log');
        const time = new Date().toLocaleTimeString();
        logContainer.innerHTML += `<div>[${time}] ${message}</div>`;
        logContainer.scrollTop = logContainer.scrollHeight; // 自动滚动到底部
    }

    // 6. 更新状态栏
    function updateStatus(message, type = 'info') {
        const statusBar = document.getElementById('status-bar');
        statusBar.textContent = message;
        statusBar.className = `status-bar ${type}`;
        statusBar.style.display = 'block';

        setTimeout(() => {
            statusBar.style.display = 'none';
        }, 3000); // 3秒后自动隐藏
    }

    // 5. 抓取笔记总览数据 (基于用户提供的精确HTML进行最终修复)
        function captureNoteOverview() {
            try {
                logToPanel('正在尝试抓取笔记总览数据...');
                
                // 基于用户提供的精确HTML结构，定位到最稳定的父容器
                const container = document.querySelector('.engage-bar-style .left');
    
                if (!container) {
                    logToPanel('错误：无法找到总览数据容器 (.engage-bar-style .left)。');
                    updateStatus('无法抓取总览', 'error');
                    document.getElementById('total-likes').textContent = '未找到';
                    document.getElementById('total-collects').textContent = '未找到';
                    document.getElementById('total-comments').textContent = '未找到';
                    return;
                }
    
                // 在该容器内部分别查找点赞、收藏和评论
                const likesEl = container.querySelector('.like-wrapper .count');
                const collectsEl = container.querySelector('.collect-wrapper .count');
                const commentsEl = container.querySelector('.chat-wrapper .count');
    
                const likes = likesEl ? likesEl.innerText.trim() : 'N/A';
                const collects = collectsEl ? collectsEl.innerText.trim() : 'N/A';
                const comments = commentsEl ? commentsEl.innerText.trim() : 'N/A';
    
                document.getElementById('total-likes').textContent = likes;
                document.getElementById('total-collects').textContent = collects;
                document.getElementById('total-comments').textContent = comments;
    
                logToPanel(`总览数据更新成功: ${likes}赞, ${collects}藏, ${comments}评`);
    
            } catch (error) {
                logToPanel(`抓取总览数据时出错: ${error.message}`);
                document.getElementById('total-likes').textContent = '错误';
                document.getElementById('total-collects').textContent = '错误';
                document.getElementById('total-comments').textContent = '错误';
            }
        }

    // 启动UI
    createUIPanel();
    logToPanel('插件已加载。');
    updateStatus('准备就绪', 'info');
    // 延迟一小会再抓取总览数据，确保页面元素加载完毕
    setTimeout(captureNoteOverview, 1000);

})();