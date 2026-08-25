import { useEffect, useMemo, useState } from 'react';

type Commit = {
  sha: string;
  commit: {
    author?: { date?: string | null } | null;
  };
};

type CommitWeek = {
  total: number;
  week: number;
};

type GitHubRepoStats = {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
};

const OWNER = 'Oghenesuvwe-dev';
const REPO = 'Oghenesuvwe-dev';
const API_BASE = 'https://api.github.com';
const WEEKS = 12;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const formatWeek = (timestamp: number) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(timestamp * 1000),
  );

const startOfWeek = (date: Date) => {
  const value = new Date(date);
  const day = value.getUTCDay();
  const diff = day === 0 ? 0 : -day;
  value.setUTCDate(value.getUTCDate() + diff);
  value.setUTCHours(0, 0, 0, 0);
  return value;
};

const buildWeeks = (commits: Commit[]): CommitWeek[] => {
  const currentWeek = startOfWeek(new Date()).getTime();
  const weeks = Array.from({ length: WEEKS }, (_, index) => {
    const week = currentWeek - (WEEKS - 1 - index) * WEEK_MS;
    return { total: 0, week: Math.floor(week / 1000) };
  });

  for (const item of commits) {
    const date = item.commit.author?.date;
    if (!date) continue;

    const timestamp = startOfWeek(new Date(date)).getTime();
    const index = Math.round((timestamp - (currentWeek - (WEEKS - 1) * WEEK_MS)) / WEEK_MS);
    if (index >= 0 && index < weeks.length) weeks[index].total += 1;
  }

  return weeks;
};

const GitHubActivityChart = () => {
  const [activity, setActivity] = useState<CommitWeek[]>([]);
  const [repo, setRepo] = useState<GitHubRepoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        // GitHub's commit_activity statistics endpoint can return a temporary
        // upstream response while GitHub calculates repository statistics.
        // Use the stable commits endpoint instead and build the weekly series
        // locally. This avoids the intermittent 202/402 failure seen in production.
        const [commitsResponse, repoResponse] = await Promise.all([
          fetch(`${API_BASE}/repos/${OWNER}/${REPO}/commits?per_page=100`, {
            headers: { Accept: 'application/vnd.github+json' },
          }),
          fetch(`${API_BASE}/repos/${OWNER}/${REPO}`, {
            headers: { Accept: 'application/vnd.github+json' },
          }),
        ]);

        if (!commitsResponse.ok) {
          throw new Error(`GitHub commits request failed (${commitsResponse.status}).`);
        }

        const commitsData = (await commitsResponse.json()) as Commit[];
        const repoData = repoResponse.ok ? ((await repoResponse.json()) as GitHubRepoStats) : null;

        if (!cancelled) {
          setActivity(buildWeeks(commitsData));
          setRepo(repoData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load GitHub activity.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadActivity();

    return () => {
      cancelled = true;
    };
  }, []);

  const maxCommits = useMemo(
    () => Math.max(...activity.map((item) => item.total), 1),
    [activity],
  );

  const totalCommits = useMemo(
    () => activity.reduce((sum, item) => sum + item.total, 0),
    [activity],
  );

  return (
    <section
      id="github-activity"
      className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
            Live engineering activity
          </p>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            GitHub Repository Activity
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
            A live view of recent commit activity on this portfolio repository, powered directly by GitHub's public API.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 sm:p-7 shadow-sm">
          {loading ? (
            <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Loading GitHub activity…
            </div>
          ) : error ? (
            <div className="h-72 flex flex-col items-center justify-center text-center">
              <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">GitHub activity is temporarily unavailable.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">The portfolio remains fully usable. Please refresh to try again.</p>
            </div>
          ) : activity.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
              No recent commit activity is available.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">12-week commits</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{totalCommits}</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Repository stars</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{repo?.stargazers_count ?? 0}</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Forks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{repo?.forks_count ?? 0}</p>
                </div>
                <div className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Open issues</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{repo?.open_issues_count ?? 0}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[680px]">
                  <div className="flex items-end gap-3 h-64 px-2">
                    {activity.map((item) => {
                      const height = Math.max((item.total / maxCommits) * 100, item.total > 0 ? 4 : 1);
                      return (
                        <div key={item.week} className="flex-1 h-full flex flex-col justify-end items-center gap-2 group">
                          <div className="relative w-full flex items-end justify-center h-full">
                            <div
                              className="w-full max-w-14 rounded-t-lg bg-blue-600 dark:bg-blue-500 transition-all duration-300 group-hover:bg-blue-700 dark:group-hover:bg-blue-400"
                              style={{ height: `${height}%` }}
                              title={`${item.total} commit${item.total === 1 ? '' : 's'} · week of ${formatWeek(item.week)}`}
                            />
                          </div>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatWeek(item.week)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
                <span>Source: GitHub public repository API</span>
                <a
                  href={`https://github.com/${OWNER}/${REPO}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  View repository on GitHub →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default GitHubActivityChart;
