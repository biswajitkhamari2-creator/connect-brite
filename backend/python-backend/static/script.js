document.addEventListener("DOMContentLoaded", () => {
    // State management
    let state = {
        news: [],
        analysis: {},
        currentTab: "tab-overview",
        activeFilter: "all",
        theme: localStorage.getItem("theme") || "dark"
    };

    // DOM Elements
    const tabButtons = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    const refreshBtn = document.getElementById("refresh-btn");
    const themeToggle = document.getElementById("theme-toggle");
    const globalSearch = document.getElementById("global-search");
    const loadingOverlay = document.getElementById("loading-overlay");
    const newsArticlesGrid = document.getElementById("news-articles-grid");
    const newsFilterContainer = document.querySelector(".news-filters");
    const newsCountBadge = document.getElementById("news-count");

    // Initialize Theme
    if (state.theme === "light") {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    } else {
        document.body.classList.add("dark-theme");
        document.body.classList.remove("light-theme");
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }

    // Toggle Theme
    themeToggle.addEventListener("click", () => {
        if (document.body.classList.contains("dark-theme")) {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem("theme", "light");
            state.theme = "light";
        } else {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            localStorage.setItem("theme", "dark");
            state.theme = "dark";
        }
    });

    // Navigation Tab Switching
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            
            // Remove active classes
            tabButtons.forEach(b => b.classList.remove("active"));
            tabContents.forEach(c => c.classList.remove("active"));
            
            // Add active classes
            btn.classList.add("active");
            document.getElementById(targetTab).classList.add("active");
            state.currentTab = targetTab;
        });
    });

    // Helper: Markdown parser
    function parseMarkdown(text) {
        if (!text) return "";
        let html = text
            // Headers
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            // Bullet lists
            .replace(/^\s*\-\s+(.*$)/gim, '<li>$1</li>')
            .replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>');
            
        // Wrap lists
        html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1<\/ul>');
        // Clean double wrapped lists
        html = html.replace(/<\/ul>\s*<ul>/gim, '');
        // Linebreaks
        html = html.replace(/\n$/gim, '<br>');
        return html;
    }

    // Load News Feed
    async function loadNews(refresh = false) {
        try {
            const res = await fetch(`/news${refresh ? "?refresh=true" : ""}`);
            const data = await res.json();
            if (data.status === "success") {
                state.news = data.news;
                newsCountBadge.textContent = state.news.length;
                renderNews();
                renderFilters();
            }
        } catch (err) {
            console.error("Failed to load news: ", err);
        }
    }

    // Render News Filters (Source Chips)
    function renderFilters() {
        const sources = [...new Set(state.news.map(item => item.source))];
        let filterHtml = `<button class="filter-chip ${state.activeFilter === 'all' ? 'active' : ''}" data-source="all">All Sources</button>`;
        
        sources.forEach(src => {
            filterHtml += `<button class="filter-chip ${state.activeFilter === src ? 'active' : ''}" data-source="${src}">${src}</button>`;
        });
        
        newsFilterContainer.innerHTML = filterHtml;

        // Re-attach listeners to dynamic chips
        document.querySelectorAll(".filter-chip").forEach(chip => {
            chip.addEventListener("click", () => {
                document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                state.activeFilter = chip.getAttribute("data-source");
                renderNews();
            });
        });
    }

    // Render News Grid
    function renderNews(searchQuery = "") {
        const filtered = state.news.filter(item => {
            const matchesSource = state.activeFilter === "all" || item.source === state.activeFilter;
            const matchesSearch = !searchQuery || 
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                item.summary.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSource && matchesSearch;
        });

        if (filtered.length === 0) {
            newsArticlesGrid.innerHTML = `<div class="card card-full"><div class="card-body placeholder-text">No articles match your search or filter criteria.</div></div>`;
            return;
        }

        newsArticlesGrid.innerHTML = filtered.map(item => `
            <div class="news-card">
                <span class="news-source">${item.source}</span>
                <h4>${item.title}</h4>
                <p>${item.summary}</p>
                <div class="news-footer">
                    <span><i class="fa-regular fa-clock"></i> ${item.published}</span>
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="read-more-link">Source <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                </div>
            </div>
        `).join("");
    }

    // Load AI Analysis Summaries and Dashboard elements
    async function loadAnalysis(refresh = false, showOverlay = true) {
        if (showOverlay) showLoading(true);
        try {
            // Summary Endpoint
            const res = await fetch(`/summary${refresh ? "?refresh=true" : ""}`);
            const summaryData = await res.json();
            
            // Populate Executive Summary
            document.getElementById("executive-summary-text").textContent = summaryData.executive_summary || "No summary generated.";

            // GS Syllabus Mapping
            const gsContainer = document.getElementById("gs-mapping-list");
            if (summaryData.upsc_gs_mapping && summaryData.upsc_gs_mapping.length > 0) {
                gsContainer.innerHTML = summaryData.upsc_gs_mapping.map(mapItem => `
                    <div class="list-item">
                        <strong>${mapItem.topic} (${mapItem.gs_paper})</strong>
                        <p><em>Syllabus Link: ${mapItem.syllabus_section}</em></p>
                        <p>${mapItem.details}</p>
                    </div>
                `).join("");
            } else {
                gsContainer.innerHTML = `<p class="placeholder-text">No GS mappings available.</p>`;
            }

            // Important Statistics & Data
            const dataContainer = document.getElementById("important-data-list");
            if (summaryData.important_data && summaryData.important_data.length > 0) {
                dataContainer.innerHTML = summaryData.important_data.map(dItem => `
                    <div class="list-item">
                        <strong>${dItem.metric}</strong>
                        <p>Value: <span class="bg-gold" style="padding: 1px 4px; border-radius: 4px;">${dItem.value}</span></p>
                        <p>UPSC Usage: ${dItem.source_relevance}</p>
                    </div>
                `).join("");
            } else {
                dataContainer.innerHTML = `<p class="placeholder-text">No analytical data compiled today.</p>`;
            }

            // Key Terms
            const keywordsContainer = document.getElementById("keywords-list");
            if (summaryData.keywords && summaryData.keywords.length > 0) {
                keywordsContainer.innerHTML = summaryData.keywords.map(kItem => `
                    <div class="list-item">
                        <strong>${kItem.term}</strong>
                        <p>${kItem.definition}</p>
                        <p class="subtitle" style="margin-top: 2px;">Use case: ${kItem.relevance_to_upsc}</p>
                    </div>
                `).join("");
            } else {
                keywordsContainer.innerHTML = `<p class="placeholder-text">No keywords compiled today.</p>`;
            }

            // Top 10 Current Affairs Timeline
            const timelineContainer = document.getElementById("top-affairs-timeline");
            if (summaryData.top_10_current_affairs && summaryData.top_10_current_affairs.length > 0) {
                timelineContainer.innerHTML = summaryData.top_10_current_affairs.map((item, idx) => `
                    <div class="timeline-item">
                        <div class="timeline-marker"></div>
                        <div class="timeline-content">
                            <div class="timeline-meta">Issue #${idx + 1}</div>
                            <h4>${item.title}</h4>
                            <p><strong>Relevance:</strong> ${item.relevance}</p>
                            <p>${item.details}</p>
                        </div>
                    </div>
                `).join("");
            } else {
                timelineContainer.innerHTML = `<p class="placeholder-text">No top current affairs items available.</p>`;
            }

            // Prelims Specific Facts
            const factsContainer = document.getElementById("prelims-facts-list");
            if (summaryData.prelims_facts && summaryData.prelims_facts.length > 0) {
                factsContainer.innerHTML = summaryData.prelims_facts.map(fItem => `
                    <div class="list-item">
                        <strong>${fItem.fact}</strong>
                        <p>${fItem.detail}</p>
                        <p class="subtitle" style="margin-top: 2px; color: var(--error-red);"><strong>Key Trap/Trick:</strong> ${fItem.key_point_to_remember}</p>
                    </div>
                `).join("");
            } else {
                factsContainer.innerHTML = `<p class="placeholder-text">No prelims specific facts compiled today.</p>`;
            }

            // Quick Revision Notes
            const revNotesContainer = document.getElementById("revision-notes-content");
            revNotesContainer.innerHTML = `<div class="revision-markdown">${parseMarkdown(summaryData.revision_notes)}</div>`;

            // Editorial Tab
            const editorialContainer = document.getElementById("editorial-analysis-content");
            if (summaryData.editorial_analysis && summaryData.editorial_analysis.length > 0) {
                editorialContainer.innerHTML = summaryData.editorial_analysis.map(edItem => `
                    <div class="editorial-card">
                        <h3>${edItem.title}</h3>
                        <p><strong>Core Issue:</strong> ${edItem.issue}</p>
                        <div class="editorial-section">
                            <h5>Key Takeaways</h5>
                            <p>${edItem.key_takeaways}</p>
                        </div>
                        <div class="editorial-section">
                            <h5>Critical Challenges</h5>
                            <p>${edItem.challenges}</p>
                        </div>
                        <div class="editorial-section">
                            <h5>Way Forward / Suggestions</h5>
                            <p>${edItem.way_forward}</p>
                        </div>
                    </div>
                `).join("");
            } else {
                editorialContainer.innerHTML = `<p class="placeholder-text">No editorial critique analysis available.</p>`;
            }

            // Load Other Endpoints in parallel now that main data is present
            await Promise.all([
                loadMCQs(refresh),
                loadMains(refresh),
                loadInterview(refresh)
            ]);

        } catch (err) {
            console.error("Failed to load summary analysis: ", err);
        } finally {
            if (showOverlay) showLoading(false);
        }
    }

    // Load MCQs
    async function loadMCQs(refresh = false) {
        try {
            const res = await fetch(`/mcqs${refresh ? "?refresh=true" : ""}`);
            const data = await res.json();
            const container = document.getElementById("mcqs-content");
            
            if (data.mcqs && data.mcqs.length > 0) {
                container.innerHTML = data.mcqs.map((item, qIdx) => {
                    const optionsHtml = item.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx); // A, B, C, D
                        return `<div class="mcq-option" data-letter="${letter}" data-correct="${item.correct_answer}">${letter}. ${opt}</div>`;
                    }).join("");

                    return `
                        <div class="mcq-card" id="mcq-q-${qIdx}">
                            <div class="mcq-q"><strong>Q${qIdx + 1}.</strong> ${item.question}</div>
                            <div class="mcq-options">${optionsHtml}</div>
                            <div class="mcq-action">
                                <button class="btn btn-secondary reveal-mcq-btn" data-target="mcq-ans-${qIdx}">Show Answer & Explanation</button>
                            </div>
                            <div class="mcq-ans-box hidden" id="mcq-ans-${qIdx}">
                                <p><strong>Correct Answer:</strong> Option ${item.correct_answer}</p>
                                <p style="margin-top: 0.5rem;">${item.explanation}</p>
                            </div>
                        </div>
                    `;
                }).join("");

                // Handle MCQ Clicks
                document.querySelectorAll(".mcq-option").forEach(opt => {
                    opt.addEventListener("click", () => {
                        const parent = opt.parentElement;
                        const siblings = parent.querySelectorAll(".mcq-option");
                        const correctLetter = opt.getAttribute("data-correct").trim();
                        const currentLetter = opt.getAttribute("data-letter");
                        
                        siblings.forEach(s => {
                            s.classList.remove("correct");
                            s.style.backgroundColor = "";
                            s.style.borderColor = "";
                        });

                        if (currentLetter === correctLetter) {
                            opt.classList.add("correct");
                        } else {
                            opt.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
                            opt.style.borderColor = "var(--error-red)";
                            
                            // Highlight the correct one
                            siblings.forEach(s => {
                                if (s.getAttribute("data-letter") === correctLetter) {
                                    s.classList.add("correct");
                                }
                            });
                        }
                    });
                });

                // Handle Reveal Buttons
                document.querySelectorAll(".reveal-mcq-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const targetId = btn.getAttribute("data-target");
                        const box = document.getElementById(targetId);
                        box.classList.toggle("hidden");
                        if (box.classList.contains("hidden")) {
                            btn.textContent = "Show Answer & Explanation";
                        } else {
                            btn.textContent = "Hide Answer & Explanation";
                        }
                    });
                });
            } else {
                container.innerHTML = `<p class="placeholder-text">Failed to generate current affairs MCQs. Ensure local Ollama is responding.</p>`;
            }
        } catch (err) {
            console.error("Failed to load MCQs: ", err);
        }
    }

    // Load Mains
    async function loadMains(refresh = false) {
        try {
            const res = await fetch(`/mains${refresh ? "?refresh=true" : ""}`);
            const data = await res.json();
            const container = document.getElementById("mains-content");

            if (data.mains_questions && data.mains_questions.length > 0) {
                container.innerHTML = data.mains_questions.map((item, mIdx) => `
                    <div class="mains-card">
                        <div class="mains-meta">${item.gs_paper || 'GS Paper General'}</div>
                        <div class="mains-question"><strong>Q${mIdx + 1}.</strong> ${item.question}</div>
                        <button class="btn btn-secondary reveal-mains-btn" data-target="mains-ans-${mIdx}">Show Answer Blueprint</button>
                        <div class="reveal-box hidden" id="mains-ans-${mIdx}">
                            <h5>Answer Structure Outline:</h5>
                            <p style="white-space: pre-line; margin-top: 0.5rem; font-size: 0.95rem;">${item.model_structure}</p>
                        </div>
                    </div>
                `).join("");

                // Handle Mains reveal
                document.querySelectorAll(".reveal-mains-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const targetId = btn.getAttribute("data-target");
                        const box = document.getElementById(targetId);
                        box.classList.toggle("hidden");
                        if (box.classList.contains("hidden")) {
                            btn.textContent = "Show Answer Blueprint";
                        } else {
                            btn.textContent = "Hide Answer Blueprint";
                        }
                    });
                });
            } else {
                container.innerHTML = `<p class="placeholder-text">Failed to generate Mains questions.</p>`;
            }
        } catch (err) {
            console.error("Failed to load Mains questions: ", err);
        }
    }

    // Load Interview Questions
    async function loadInterview(refresh = false) {
        try {
            const res = await fetch(`/interview${refresh ? "?refresh=true" : ""}`);
            const data = await res.json();
            const container = document.getElementById("interview-content");

            if (data.interview_questions && data.interview_questions.length > 0) {
                container.innerHTML = data.interview_questions.map((item, iIdx) => `
                    <div class="interview-card">
                        <div class="interview-question"><strong>Q${iIdx + 1}.</strong> ${item.question}</div>
                        <p class="subtitle"><strong>Contextual Importance:</strong> ${item.contextual_relevance}</p>
                        <button class="btn btn-secondary reveal-int-btn" data-target="int-ans-${iIdx}" style="margin-top: 0.8rem;">Show Administrative Hint</button>
                        <div class="reveal-box hidden" id="int-ans-${iIdx}">
                            <h5>Balanced Bureaucratic Standpoint Hint:</h5>
                            <p style="margin-top: 0.5rem; font-size: 0.95rem;">${item.hint_answer}</p>
                        </div>
                    </div>
                `).join("");

                // Handle Interview reveal
                document.querySelectorAll(".reveal-int-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        const targetId = btn.getAttribute("data-target");
                        const box = document.getElementById(targetId);
                        box.classList.toggle("hidden");
                        if (box.classList.contains("hidden")) {
                            btn.textContent = "Show Administrative Hint";
                        } else {
                            btn.textContent = "Hide Administrative Hint";
                        }
                    });
                });
            } else {
                container.innerHTML = `<p class="placeholder-text">Failed to generate Interview guides.</p>`;
            }
        } catch (err) {
            console.error("Failed to load interview guidelines: ", err);
        }
    }

    // Search Action
    globalSearch.addEventListener("input", (e) => {
        const query = e.target.value;
        if (state.currentTab === "tab-news") {
            renderNews(query);
        } else {
            // Simple DOM highlights or filter for other lists if desired
            highlightSearch(query);
        }
    });

    // Custom search matching for non-news elements
    function highlightSearch(query) {
        const cards = document.querySelectorAll(".card, .mcq-card, .mains-card, .interview-card, .editorial-card");
        if (!query) {
            cards.forEach(c => {
                c.style.display = "";
                c.style.opacity = "";
            });
            return;
        }

        cards.forEach(c => {
            const text = c.textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                c.style.display = "";
                c.style.opacity = "1";
            } else {
                c.style.display = "none";
            }
        });
    }

    // Global Manual Refresh
    refreshBtn.addEventListener("click", async () => {
        const refreshIcon = refreshBtn.querySelector("i");
        refreshIcon.classList.add("fa-spin");
        refreshBtn.disabled = true;
        
        await loadNews(true);
        await loadAnalysis(true);
        
        refreshIcon.classList.remove("fa-spin");
        refreshBtn.disabled = false;
    });

    // Helper: Show/Hide Loading
    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.remove("hidden");
        } else {
            loadingOverlay.classList.add("hidden");
        }
    }

    // Main Init Flow
    async function init() {
        showLoading(true);
        try {
            // Load news cache first so user has immediate feed content
            await loadNews(false);
        } catch (err) {
            console.error("Init news load failed: ", err);
        } finally {
            // Dismiss full screen loader as soon as news (or placeholder layout) is ready
            showLoading(false);
        }
        
        try {
            // Load analysis in the background without blocking the UI
            await loadAnalysis(false, false);
        } catch (err) {
            console.error("Init analysis load failed: ", err);
        }
    }

    init();
});
