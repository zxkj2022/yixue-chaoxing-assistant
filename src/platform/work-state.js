'use strict';

function workId(task) {
    const value = task?.jobid || task?.property?._jobid || task?.property?.workid;
    return typeof value === 'string' || typeof value === 'number' ? String(value).replace(/^work-/, '') : '';
}

function completedFlag(value) {
    return value === true || value === 1 || value === '1' || value === 'true';
}

function completedWork(records, task, chapter, context) {
    const id = workId(task);
    if (!id) return false;
    const recordIds = record => [record.workId, record.workid, record.work_id, record.jobid, record._jobid].filter(value => value !== undefined && value !== null && value !== '');
    const scopeMatches = record => {
        if (!record || typeof record !== 'object') return false;
        for (const [keys, expected] of [[['chapterId', 'chapterid', 'knowledgeId', 'knowledgeid'], chapter.id], [['courseId', 'courseid'], context.courseId], [['classId', 'classid', 'clazzId', 'clazzid'], context.classId]]) {
            if (keys.some(key => record[key] !== undefined && record[key] !== null && record[key] !== '' && String(record[key]) !== String(expected))) return false;
        }
        return true;
    };
    let matches = records.filter(record => {
        if (!scopeMatches(record)) return false;
        const ids = recordIds(record);
        return ids.length > 0 && ids.every(value => String(value).replace(/^work-/, '') === id);
    });
    // Some school deployments omit work IDs. A chapter alone is evidence only
    // after every card was scanned and both sides contain exactly one quiz.
    const chapterWorks = new Set((chapter.outcomes || []).filter(outcome => outcome.task?.type === 'workid').map(outcome => workId(outcome.task)).filter(Boolean));
    if (!matches.length && chapter.done && chapterWorks.size === 1 && chapterWorks.has(id)) {
        const chapterRows = records.filter(record => scopeMatches(record) && [record.chapterId, record.chapterid, record.knowledgeId, record.knowledgeid].some(value => value !== undefined && String(value) === String(chapter.id)));
        if (chapterRows.length === 1 && !recordIds(chapterRows[0]).length) matches = chapterRows;
    }
    const submitted = new Set(['已完成', '待批阅', '已提交', '已批阅', '已批改']);
    return matches.length > 0 && matches.every(record => submitted.has(String(record.statusStr || '').trim()));
}

function createWorkStatusReader({ context, requestJSON, now }) {
    let snapshot = [], updatedAt = -Infinity, flight = null;
    return async function read({ force = false } = {}) {
        if (flight) return flight;
        if (!force && now() - updatedAt < 30000) return snapshot;
        const url = new URL(context.origin);
        url.hostname = url.hostname.replace(/^mooc(?:1(?:-\d+|-api)?|2-ans)?\./, 'stat2-ans.');
        url.pathname = '/stat2/chapter-exam/s/tests/data';
        updatedAt = now();
        flight = (async () => {
            const records = [], seen = new Set();
            for (let page = 1; page <= 100; page++) {
                const response = await requestJSON(url.href, { courseid: context.courseId, clazzid: context.classId, cpi: context.cpi, ut: 's', pageSize: 200, page, _dc: now() });
                const rows = response?.data?.results;
                if (!Array.isArray(rows)) throw new Error('章节测验统计格式不正确');
                if (!rows.length) break;
                const fingerprint = JSON.stringify(rows);
                if (seen.has(fingerprint)) break;
                seen.add(fingerprint); records.push(...rows);
                if (Number.isSafeInteger(response.data.total) && records.length >= response.data.total) break;
            }
            snapshot = records; updatedAt = now(); return records;
        })().finally(() => { flight = null; });
        return flight;
    };
}

module.exports = { workId, completedFlag, completedWork, createWorkStatusReader };
