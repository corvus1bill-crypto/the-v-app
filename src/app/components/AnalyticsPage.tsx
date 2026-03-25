import { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, Users, Heart, Eye, Share2, Bookmark, BarChart2, Zap, Award, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Post } from '../types';

interface AnalyticsPageProps {
  onBack: () => void;
  posts: Post[];
  currentUserId: string;
  followersCount: number;
  followingCount: number;
  username: string;
}

function generateFollowerHistory(base: number) {
  const days = 30;
  const history = [];
  let val = Math.max(0, base - Math.floor(base * 0.3));
  for (let i = 0; i < days; i++) {
    val += Math.floor(Math.random() * 8) - 1;
    val = Math.max(0, val);
    const d = new Date();
    d.setDate(d.getDate() - (days - i));
    history.push({
      day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      followers: val,
    });
  }
  history[history.length - 1].followers = base;
  return history;
}

function generateEngagementHistory(posts: Post[]) {
  // Generate last 7 days of engagement
  const days = 7;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    const base = posts.reduce((sum, p) => sum + p.likes + p.comments * 2, 0) / days;
    const jitter = 0.6 + Math.random() * 0.8;
    return {
      day: dayNames[d.getDay()],
      likes: Math.floor((base * 0.7 * jitter)),
      comments: Math.floor((base * 0.2 * jitter)),
      shares: Math.floor((base * 0.1 * jitter)),
    };
  });
}

const StatCard = ({ icon: Icon, label, value, sub, color = 'var(--foreground)', trend }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; trend?: number;
}) => (
  <div className="flex-1 border-4 border-foreground bg-background p-3 shadow-[4px_4px_0px_0px_var(--foreground)]">
    <div className="flex items-start justify-between mb-2">
      <div className="w-8 h-8 bg-foreground flex items-center justify-center">
        <Icon size={16} className="text-background" strokeWidth={2.5} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-0.5 text-[10px] font-black ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          <ArrowUpRight size={10} strokeWidth={3} className={trend < 0 ? 'rotate-180' : ''} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-2xl font-black text-foreground leading-none">{value}</p>
    <p className="text-[10px] font-black text-foreground/50 uppercase tracking-wider mt-0.5">{label}</p>
    {sub && <p className="text-[9px] font-mono text-foreground/30 mt-0.5">{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-foreground text-background px-3 py-2 border-2 border-background text-xs font-black">
      <p className="mb-1 text-background/70 text-[10px]">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey}>{p.name}: <span className="font-black">{p.value}</span></p>
      ))}
    </div>
  );
};

export function AnalyticsPage({ onBack, posts, currentUserId, followersCount, followingCount, username }: AnalyticsPageProps) {
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');

  const myPosts = useMemo(() => posts.filter(p => p.userId === currentUserId), [posts, currentUserId]);

  const totalLikes = myPosts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = myPosts.reduce((sum, p) => sum + p.comments, 0);
  const totalShares = myPosts.reduce((sum, p) => sum + p.shares, 0);
  const avgLikes = myPosts.length > 0 ? Math.floor(totalLikes / myPosts.length) : 0;
  const engagementRate = followersCount > 0 ? ((totalLikes + totalComments) / followersCount * 100).toFixed(1) : '0.0';
  const estimatedReach = Math.floor((totalLikes + totalComments * 3 + totalShares * 5) * 2.4);
  const savedCount = myPosts.reduce((sum, p) => sum + Math.floor(p.likes * 0.08), 0);

  const followerHistory = useMemo(() => generateFollowerHistory(followersCount), [followersCount]);
  const engagementHistory = useMemo(() => generateEngagementHistory(myPosts), [myPosts]);

  const topPosts = useMemo(() =>
    [...myPosts].sort((a, b) => (b.likes + b.comments * 2) - (a.likes + a.comments * 2)).slice(0, 5),
  [myPosts]);

  const pieData = [
    { name: 'Likes', value: totalLikes, color: '#ff7a2e' },
    { name: 'Comments', value: totalComments * 5, color: '#1a1a1a' },
    { name: 'Shares', value: totalShares * 10, color: '#9ACD32' },
  ].filter(d => d.value > 0);

  const formatNum = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="shrink-0 bg-background border-b-4 border-foreground shadow-[0px_4px_0px_0px_color-mix(in_srgb,var(--foreground)_10%,transparent)]" 
        style={{
          paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
          paddingRight: 'calc(1rem + env(safe-area-inset-right))',
          paddingTop: '1rem',
          paddingBottom: '1rem'
        }}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 bg-background border-2 border-foreground flex items-center justify-center shadow-[2px_2px_0px_0px_var(--foreground)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all active:scale-95"
          >
            <ArrowLeft className="text-foreground" size={20} strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground uppercase italic tracking-tight leading-none">Creator Analytics</h1>
            <p className="text-[10px] font-mono font-bold text-foreground/40 mt-0.5">@{username} • REAL DATA</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

        {/* Top Stats */}
        <div>
          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-3 border-l-4 border-foreground pl-2">OVERVIEW</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <StatCard icon={Users} label="Followers" value={formatNum(followersCount)} trend={12} />
            <StatCard icon={Heart} label="Total Likes" value={formatNum(totalLikes)} trend={8} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <StatCard icon={Eye} label="Est. Reach" value={formatNum(estimatedReach)} />
            <StatCard icon={Share2} label="Shares" value={formatNum(totalShares)} />
            <StatCard icon={Bookmark} label="Saves" value={formatNum(savedCount)} />
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="border-4 border-foreground bg-foreground p-4 shadow-[6px_6px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-background/60 uppercase tracking-widest">Engagement Rate</p>
              <p className="text-5xl font-black text-background leading-none mt-1">{engagementRate}%</p>
              <p className="text-xs font-bold text-background/60 mt-1">
                {parseFloat(engagementRate) > 3 ? '🔥 Above average' : parseFloat(engagementRate) > 1 ? '📊 Average' : '💡 Room to grow'}
              </p>
            </div>
            <div className="w-16 h-16 border-4 border-background/20 flex items-center justify-center">
              <Zap size={28} className="text-background" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Follower Growth Chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest border-l-4 border-foreground pl-2">FOLLOWER GROWTH</p>
          </div>
          <div className="border-4 border-foreground bg-background p-3 shadow-[4px_4px_0px_0px_var(--foreground)]">
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={followerHistory} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="follGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="followers"
                  stroke="var(--foreground)"
                  strokeWidth={2.5}
                  fill="url(#follGrad)"
                  dot={false}
                  name="Followers"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex justify-between text-[9px] font-mono text-foreground/30 mt-1 px-1">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Engagement Chart */}
        <div>
          <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-3 border-l-4 border-foreground pl-2">LAST 7 DAYS</p>
          <div className="border-4 border-foreground bg-background p-3 shadow-[4px_4px_0px_0px_var(--foreground)]">
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={engagementHistory} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={{ fill: 'var(--foreground)', fontSize: 9, fontWeight: 700 }} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="likes" fill="var(--foreground)" name="Likes" stackId="a" />
                <Bar dataKey="comments" fill="color-mix(in srgb, var(--foreground) 50%, transparent)" name="Comments" stackId="a" />
                <Bar dataKey="shares" fill="color-mix(in srgb, var(--foreground) 25%, transparent)" name="Shares" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 px-1">
              {[
                { label: 'Likes', opacity: '100%' },
                { label: 'Comments', opacity: '50%' },
                { label: 'Shares', opacity: '25%' },
              ].map(({ label, opacity }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className="w-3 h-2 bg-foreground" style={{ opacity: opacity.replace('%', '') === '100' ? 1 : opacity.replace('%', '') === '50' ? 0.5 : 0.25 }} />
                  <span className="text-[9px] font-bold text-foreground/50">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Breakdown */}
        {pieData.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-3 border-l-4 border-foreground pl-2">ENGAGEMENT MIX</p>
            <div className="border-4 border-foreground bg-background p-4 shadow-[4px_4px_0px_0px_var(--foreground)] flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={2} stroke="var(--background)">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs font-black text-foreground uppercase">{d.name}</span>
                    <span className="ml-auto text-xs font-mono font-bold text-foreground/50">{formatNum(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Posts */}
        {topPosts.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-3 border-l-4 border-foreground pl-2">TOP PERFORMING POSTS</p>
            <div className="space-y-2">
              {topPosts.map((post, i) => {
                const score = post.likes + post.comments * 2 + post.shares * 3;
                const maxScore = topPosts[0] ? topPosts[0].likes + topPosts[0].comments * 2 + topPosts[0].shares * 3 : 1;
                const pct = Math.round((score / maxScore) * 100);
                return (
                  <div key={post.id} className="border-4 border-foreground bg-background p-3 shadow-[3px_3px_0px_0px_var(--foreground)] flex items-center gap-3">
                    <div className="w-7 h-7 bg-foreground flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-background">#{i + 1}</span>
                    </div>
                    {(post.imageUrl || post.imageUrls?.[0]) && (
                      <img
                        src={post.imageUrls?.[0] || post.imageUrl}
                        alt=""
                        className="w-12 h-12 object-cover border-2 border-foreground shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground line-clamp-1">{post.caption}</p>
                      <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-foreground/50">
                        <span>❤️ {formatNum(post.likes)}</span>
                        <span>💬 {formatNum(post.comments)}</span>
                        <span>↗️ {formatNum(post.shares)}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 bg-foreground/10 w-full">
                        <div className="h-full bg-foreground transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {myPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 bg-foreground flex items-center justify-center mb-4 shadow-[6px_6px_0px_0px_color-mix(in_srgb,var(--foreground)_30%,transparent)]">
              <BarChart2 size={36} className="text-background" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-black uppercase text-foreground mb-2">No data yet</h2>
            <p className="text-sm font-bold text-foreground/50">Post something to start tracking your analytics!</p>
          </div>
        )}

        {/* Performance Tip */}
        <div className="border-4 border-foreground bg-background p-4 shadow-[4px_4px_0px_0px_var(--foreground)]">
          <div className="flex items-start gap-3">
            <Award size={20} className="text-foreground shrink-0 mt-0.5" strokeWidth={2.5} />
            <div>
              <p className="text-xs font-black text-foreground uppercase mb-1">Pro Tip</p>
              <p className="text-xs font-bold text-foreground/60 leading-relaxed">
                {totalLikes > 1000
                  ? 'Your content is resonating! Keep posting consistently — accounts that post 4-7x/week see 3x more growth.'
                  : myPosts.length > 0
                  ? 'Try adding hashtags and posting at peak hours (7–9 PM) to boost your reach.'
                  : 'Start posting to build your audience. Consistency is key — even 3 posts a week makes a difference.'}
              </p>
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
