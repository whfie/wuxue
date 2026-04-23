const baseScriptUrl = document.currentScript?.src || new URL('js/base.js', window.location.href).href;
const FORCE_REFRESH_TIMEOUT_MS = 90 * 1000;
let forceRefreshModalInstance = null;
let forceRefreshRunning = false;
let forceRefreshAbortController = null;

function toggleOptionMenu(event) {
    const menu = document.getElementById('optionMenu');
    if (!menu) {
        return;
    }

    if (menu.style.display === 'block') {
        menu.style.display = 'none';
        return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();
    menu.style.visibility = 'hidden';
    menu.style.display = 'block';
    menu.style.left = `${Math.max(8, buttonRect.right + window.scrollX - menu.offsetWidth)}px`;
    menu.style.top = `${buttonRect.bottom + window.scrollY}px`;
    menu.style.visibility = '';
}

function removeForceRefreshCacheBust() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('_wuxue_refresh')) {
        return;
    }

    url.searchParams.delete('_wuxue_refresh');
    window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
}

function reloadWithCacheBust() {
    const url = new URL(window.location.href);
    url.searchParams.set('_wuxue_refresh', Date.now().toString());
    window.location.replace(url.toString());
}

function setForceRefreshStatus(message, type = 'muted') {
    const status = document.getElementById('forceRefreshStatus');
    if (!status) {
        return;
    }

    status.className = `small mt-3 text-${type}`;
    status.textContent = message;
}

function resetForceRefreshProgress() {
    const progressWrap = document.getElementById('forceRefreshProgressWrap');
    const progressBar = document.getElementById('forceRefreshProgressBar');
    const progressText = document.getElementById('forceRefreshProgressText');

    if (progressWrap) {
        progressWrap.hidden = true;
    }
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.setAttribute('aria-valuenow', '0');
        progressBar.textContent = '0%';
    }
    if (progressText) {
        progressText.textContent = '';
    }
}

function setForceRefreshProgress(progress) {
    const progressWrap = document.getElementById('forceRefreshProgressWrap');
    const progressBar = document.getElementById('forceRefreshProgressBar');
    const progressText = document.getElementById('forceRefreshProgressText');

    if (!progressWrap || !progressBar || !progressText) {
        return;
    }

    const total = Math.max(1, Number(progress.total) || 1);
    const completed = Math.max(0, Math.min(total, Number(progress.completed) || 0));
    const percent = Math.round((completed / total) * 100);
    const stage = progress.stage || '正在更新数据';

    progressWrap.hidden = false;
    progressBar.style.width = `${percent}%`;
    progressBar.setAttribute('aria-valuenow', String(percent));
    progressBar.textContent = `${percent}%`;
    progressText.textContent = `${stage}（${completed}/${total}）`;
}

function setForceRefreshPending(isPending) {
    const confirmBtn = document.getElementById('forceRefreshConfirmBtn');
    const cancelBtn = document.getElementById('forceRefreshCancelBtn');
    const closeBtn = document.getElementById('forceRefreshCloseBtn');
    const modal = document.getElementById('forceRefreshModal');
    if (confirmBtn) {
        confirmBtn.disabled = isPending;
        confirmBtn.textContent = isPending ? '正在重新拉取...' : '清缓存并刷新';
    }
    if (cancelBtn) {
        cancelBtn.disabled = isPending;
    }
    if (closeBtn) {
        closeBtn.disabled = isPending;
    }
    if (modal) {
        modal.classList.toggle('is-running', isPending);
    }
    document.body.classList.toggle('force-refresh-running', isPending);
}

function ensureForceRefreshModal() {
    let modal = document.getElementById('forceRefreshModal');
    if (modal) {
        return modal;
    }

    document.body.insertAdjacentHTML('beforeend', `
        <div class="modal fade force-refresh-modal" id="forceRefreshModal" tabindex="-1" aria-labelledby="forceRefreshModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="forceRefreshModalLabel">清缓存并刷新</h5>
                        <button type="button" class="btn-close" id="forceRefreshCloseBtn" data-bs-dismiss="modal" aria-label="关闭"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-2">将重新下载全部数据，成功后刷新当前页面</p>
                        <p class="mb-0 text-muted small">请耐心等待数据导入</p>
                        <div class="force-refresh-progress mt-3" id="forceRefreshProgressWrap" hidden>
                            <div class="progress" role="progressbar" aria-label="清缓存刷新进度" aria-valuemin="0" aria-valuemax="100">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" id="forceRefreshProgressBar" style="width: 0%" aria-valuenow="0">0%</div>
                            </div>
                            <div class="small text-muted mt-2" id="forceRefreshProgressText" aria-live="polite"></div>
                        </div>
                        <div class="small mt-3 text-muted" id="forceRefreshStatus" aria-live="polite"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="forceRefreshCancelBtn" data-bs-dismiss="modal">取消</button>
                        <button type="button" class="btn btn-primary" id="forceRefreshConfirmBtn">清缓存并刷新</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    modal = document.getElementById('forceRefreshModal');
    modal.addEventListener('hide.bs.modal', (event) => {
        if (forceRefreshRunning) {
            event.preventDefault();
        }
    });
    modal.addEventListener('hidden.bs.modal', () => {
        if (forceRefreshRunning) {
            return;
        }

        modal.classList.remove('top-modal');
        setForceRefreshStatus('');
        setForceRefreshPending(false);
        resetForceRefreshProgress();
    });

    const confirmBtn = document.getElementById('forceRefreshConfirmBtn');
    confirmBtn.addEventListener('click', handleForceRefreshConfirm);
    return modal;
}

function showForceRefreshModal() {
    const modal = ensureForceRefreshModal();
    if (!window.bootstrap?.Modal) {
        if (window.confirm('将重新下载全部数据，成功后刷新当前页面。继续吗？')) {
            handleForceRefreshConfirm();
        }
        return;
    }

    modal.classList.add('top-modal');
    setForceRefreshStatus('');
    setForceRefreshPending(false);
    resetForceRefreshProgress();
    forceRefreshModalInstance = forceRefreshModalInstance || new bootstrap.Modal(modal, {
        backdrop: 'static',
        keyboard: false
    });
    forceRefreshModalInstance.show();
}

async function handleForceRefreshConfirm() {
    if (forceRefreshRunning) {
        return;
    }

    forceRefreshRunning = true;
    forceRefreshAbortController = typeof AbortController === 'undefined'
        ? null
        : new AbortController();
    setForceRefreshPending(true);
    setForceRefreshStatus('下载中请勿关闭页面，完成后会自动刷新。', 'muted');
    setForceRefreshProgress({
        completed: 0,
        total: 1,
        stage: '正在准备'
    });
    const timeoutId = window.setTimeout(() => {
        forceRefreshAbortController?.abort();
    }, FORCE_REFRESH_TIMEOUT_MS);

    try {
        const serviceUrl = new URL('services/forceRefreshService.js', baseScriptUrl).href;
        const { forceRefreshAllData } = await import(serviceUrl);
        const result = await forceRefreshAllData({
            signal: forceRefreshAbortController?.signal,
            onProgress: setForceRefreshProgress
        });
        window.clearTimeout(timeoutId);
        setForceRefreshStatus(`已重新拉取 ${result.resourceIds.length} 份数据，正在刷新...`, 'success');
        window.setTimeout(reloadWithCacheBust, 500);
    } catch (error) {
        window.clearTimeout(timeoutId);
        console.error('Force refresh failed:', error);
        forceRefreshRunning = false;
        forceRefreshAbortController = null;
        setForceRefreshPending(false);
        const isAbort = error?.name === 'AbortError';
        setForceRefreshStatus(isAbort
            ? '下载失败：等待时间过长，请检查网络后重试。'
            : `下载失败：${error.message || error}。请检查网络后重试。`,
            'danger');
    }
}

function ensureForceRefreshMenuItem() {
    const menu = document.getElementById('optionMenu');
    if (!menu || document.getElementById('forceRefreshMenuBtn')) {
        return;
    }

    const divider = document.createElement('div');
    divider.className = 'option-menu-divider';

    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'forceRefreshMenuBtn';
    button.className = 'option-menu-action';
    button.textContent = '清缓存并刷新';
    button.addEventListener('click', () => {
        menu.style.display = 'none';
        showForceRefreshModal();
    });

    menu.appendChild(divider);
    menu.appendChild(button);
}

document.addEventListener('DOMContentLoaded', () => {
    removeForceRefreshCacheBust();
    ensureForceRefreshMenuItem();

    const optionBtn = document.getElementById('optionBtn');
    if (!optionBtn) {
        return;
    }

    optionBtn.addEventListener('click', (event) => {
        toggleOptionMenu(event);
    });
});
