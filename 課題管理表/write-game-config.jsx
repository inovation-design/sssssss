import React, { useState, useEffect, useMemo } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../src/firebase.ts';
import { 
  Plus, CheckCircle2, Circle, Calendar, Clock, Share2, 
  BookOpen, Sparkles, FileText, X, 
  Trash2, Filter, Zap, ArrowLeft, Users,
  RefreshCw, AlertTriangle
} from 'lucide-react';

// クラス一覧 (1年1組 〜 1年8組)
const CLASSES = Array.from({ length: 8 }, (_, i) => ({
  id: `1-${i + 1}`,
  name: `1年${i + 1}組`,
  grade: 1,
  roomNumber: i + 1,
  color: [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-purple-500 to-violet-600',
    'from-cyan-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
    'from-lime-500 to-emerald-600'
  ][i % 8]
}));

const SUBJECT_COLORS = {
  '英語': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', tagBg: 'bg-blue-600' },
  '数学': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', tagBg: 'bg-rose-600' },
  '国語': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', tagBg: 'bg-amber-600' },
  '理科': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', tagBg: 'bg-emerald-600' },
  '社会': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', tagBg: 'bg-purple-600' },
  '情報': { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', tagBg: 'bg-cyan-600' },
  'その他': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', tagBg: 'bg-slate-600' },
};

const WEEKDAYS = [
  { key: 'Mon', label: '月' },
  { key: 'Tue', label: '火' },
  { key: 'Wed', label: '水' },
  { key: 'Thu', label: '木' },
  { key: 'Fri', label: '金' },
];

const getFormattedDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 初期デモデータ (クラスごとに分類)
const INITIAL_TIMETABLE = {
  Mon: ['英語', '数学', '国語', '理科', '体育', '情報'],
  Tue: ['数学', '英語', '社会', '理科', '国語', 'HR'],
  Wed: ['国語', '社会', '英語', '数学', '総合', '探究'],
  Thu: ['理科', '英語', '数学', '社会', '保健', '情報'],
  Fri: ['数学', '国語', '理科', '英語', '芸術', 'LHR'],
};

const TIMETABLE_SUBJECT_OPTIONS = [
  '', 'その他', '現代の国語', '言語文化', '地理総合', '歴史総合', '数ⅠⅡ',
  '数学A', '物理基礎', '生物基礎', '保健', '芸術', '英語C', '論表', '家庭基礎', 'HRA', 'GS',
];

export default function App() {
  // --- ルーティング状態管理 (#/class/1-1 風のハッシュルーティング) ---
  const [currentClassId, setCurrentClassId] = useState(() => {
    const hash = window.location.hash;
    const match = hash.match(/#\/class\/(1-[1-8])/);
    return match ? match[1] : null;
  });

  // ハッシュ変更検知
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/#\/class\/(1-[1-8])/);
      if (match) {
        setCurrentClassId(match[1]);
      } else {
        setCurrentClassId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToClass = (classId) => {
    window.location.hash = `#/class/${classId}`;
    setCurrentClassId(classId);
  };

  const navigateToHome = () => {
    window.location.hash = '';
    setCurrentClassId(null);
  };

  // --- Firestore共有データ ---
  const [remoteAssignments, setRemoteAssignments] = useState({});
  const [cloudSyncStatus, setCloudSyncStatus] = useState('connecting');
  const [timetable, setTimetable] = useState(INITIAL_TIMETABLE);
  const [timetableDraft, setTimetableDraft] = useState(INITIAL_TIMETABLE);
  const [isSavingTimetable, setIsSavingTimetable] = useState(false);
  const [editingTimetableSlot, setEditingTimetableSlot] = useState(null);

  // 個人ごとの完了チェック（localStorage）
  const [completedIds, setCompletedIds] = useState(() => {
    const saved = localStorage.getItem('classboard_user_completed');
    return saved ? JSON.parse(saved) : [];
  });

  // UI状態
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'timetable'
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarDate, setCalendarDate] = useState(getFormattedDate(0));
  const [calendarView, setCalendarView] = useState('year');
  const [filterSubject, setFilterSubject] = useState('すべて');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // 課題追加モーダル
  const [selectedImage, setSelectedImage] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [analyzedAssignments, setAnalyzedAssignments] = useState([]);
  const [manualSubject, setManualSubject] = useState('英語');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDueDate, setManualDueDate] = useState(getFormattedDate(1));
  const [isSavingManualAssignment, setIsSavingManualAssignment] = useState(false);

  // Firestoreの変更を購読し、他端末の追加・削除もリアルタイム反映する
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'assignments'), (snapshot) => {
      const groupedAssignments = {};
      snapshot.docs.forEach((assignmentDoc) => {
        const assignment = { id: assignmentDoc.id, ...assignmentDoc.data() };
        if (!groupedAssignments[assignment.class_id]) groupedAssignments[assignment.class_id] = [];
        groupedAssignments[assignment.class_id].push(assignment);
      });
      setRemoteAssignments(groupedAssignments);
      setCloudSyncStatus('connected');
    }, (error) => {
      console.error('Firestore subscription failed:', error);
      setCloudSyncStatus('error');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentClassId) return;
    const defaultTimetable = INITIAL_TIMETABLE;
    setTimetable(defaultTimetable);
    setTimetableDraft(defaultTimetable);
    const unsubscribe = onSnapshot(doc(db, 'timetables', currentClassId), (snapshot) => {
      const savedTimetable = snapshot.exists() ? snapshot.data().days : null;
      const nextTimetable = savedTimetable
        ? Object.fromEntries(WEEKDAYS.map(({ key }) => [
            key,
            Array.from({ length: 6 }, (_, index) => savedTimetable[key]?.[index] ?? ''),
          ]))
        : defaultTimetable;
      setTimetable(nextTimetable);
      setTimetableDraft(nextTimetable);
    }, (error) => {
      console.error('Firestore timetable subscription failed:', error);
      showToast('時間割を読み込めませんでした');
    });
    return unsubscribe;
  }, [currentClassId]);

  useEffect(() => {
    localStorage.setItem('classboard_user_completed', JSON.stringify(completedIds));
  }, [completedIds]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 現在選択中のクラス情報
  const currentClassObj = CLASSES.find(c => c.id === currentClassId);

  // 現在のクラスの課題リスト
  const currentAssignments = useMemo(() => {
    if (!currentClassId) return [];
    return remoteAssignments[currentClassId] || [];
  }, [remoteAssignments, currentClassId]);

  const assignmentsByDueDate = useMemo(() => currentAssignments.reduce((grouped, assignment) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(assignment.due_date || '')) return grouped;
    grouped[assignment.due_date] = [...(grouped[assignment.due_date] || []), assignment];
    return grouped;
  }, {}), [currentAssignments]);

  const assignmentsInCalendarYear = useMemo(() => currentAssignments.filter((assignment) =>
    (assignment.due_date || '').startsWith(`${calendarYear}-`)
  ), [currentAssignments, calendarYear]);

  const assignmentsOnCalendarDate = assignmentsByDueDate[calendarDate] || [];

  const calendarMonthStart = new Date(calendarYear, calendarMonth, 1);
  const calendarMonthDayCount = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarMonthCells = [
    ...Array(calendarMonthStart.getDay()).fill(null),
    ...Array.from({ length: calendarMonthDayCount }, (_, index) => index + 1),
  ];

  const changeCalendarMonth = (offset) => {
    const nextMonth = new Date(calendarYear, calendarMonth + offset, 1);
    const nextYear = nextMonth.getFullYear();
    const nextMonthIndex = nextMonth.getMonth();
    setCalendarYear(nextYear);
    setCalendarMonth(nextMonthIndex);
    setCalendarDate(`${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-01`);
  };

  const changeCalendarYear = (offset) => {
    const nextYear = calendarYear + offset;
    setCalendarYear(nextYear);
    setCalendarDate(`${nextYear}-${String(calendarMonth + 1).padStart(2, '0')}-01`);
  };

  // 日付・時間判定
  const todayDateStr = getFormattedDate(0);
  const getTomorrowDayKey = () => {
    const now = new Date();
    const day = (now.getDay() + 1) % 7;
    const dayMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (dayMap[day] === 'Sat' || dayMap[day] === 'Sun') ? 'Mon' : dayMap[day];
  };

  const tomorrowDayKey = getTomorrowDayKey();
  const tomorrowSubjects = (timetable[tomorrowDayKey] || []).filter(Boolean);

  const saveTimetable = async () => {
    if (!currentClassId) return;
    setIsSavingTimetable(true);
    try {
      await setDoc(doc(db, 'timetables', currentClassId), {
        days: timetableDraft,
        updated_at: new Date().toISOString(),
      });
      setTimetable(timetableDraft);
      showToast(`${currentClassObj?.name}の時間割を保存しました`);
    } catch (error) {
      console.error('Firestore timetable save failed:', error);
      showToast('時間割を保存できませんでした');
    } finally {
      setIsSavingTimetable(false);
    }
  };

  const getDaysLeft = (dueDateStr) => {
    const today = new Date(todayDateStr);
    const due = new Date(dueDateStr);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 個人用完了チェックトグル
  const toggleComplete = (id) => {
    setCompletedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // クラウド課題追加 (全ユーザーに同期)
  const addAssignmentsToClass = async (newItems) => {
    if (!currentClassId) return;
    await Promise.all(newItems.map(({ id, ...assignment }) =>
      addDoc(collection(db, 'assignments'), assignment)
    ));
  };

  // クラウド課題削除 (全ユーザーに同期)
  const deleteAssignmentFromClass = async (id) => {
    if (!currentClassId) return;
    try {
      await deleteDoc(doc(db, 'assignments', id));
    } catch (error) {
      console.error('Firestore delete failed:', error);
      showToast('課題を削除できませんでした');
      return;
    }
    setCompletedIds(prev => prev.filter(i => i !== id));
    showToast('課題を削除しました（全員の画面に反映されます）');
  };

  // ハイライト（要対応課題）
  const highlightedAssignments = useMemo(() => {
    return currentAssignments.filter(a => {
      if (completedIds.includes(a.id)) return false;
      const daysLeft = getDaysLeft(a.due_date);
      const isUrgent = daysLeft <= 1;
      const isTomorrowClassSubject = tomorrowSubjects.includes(a.subject);
      return isUrgent || isTomorrowClassSubject;
    });
  }, [currentAssignments, completedIds, tomorrowSubjects]);

  // ソートされた課題一覧
  const sortedAssignments = useMemo(() => {
    return [...currentAssignments]
      .filter(a => filterSubject === 'すべて' || a.subject === filterSubject)
      .sort((a, b) => {
        const isAComp = completedIds.includes(a.id);
        const isBComp = completedIds.includes(b.id);
        if (isAComp !== isBComp) return isAComp ? 1 : -1;
        if (!a.due_date && b.due_date) return 1;
        if (a.due_date && !b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      });
  }, [currentAssignments, completedIds, filterSubject]);

  // 特定のクラスのLINE共有用URLをコピー
  const handleShareCurrentClass = () => {
    const url = `${window.location.origin}${window.location.pathname}#/class/${currentClassId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    showToast(`🚀 ${currentClassObj?.name} 専用URLをコピーしました！LINEに貼って共有できます`);
  };

  const handleImageSelected = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('JPEG、PNG、WebP形式の画像を選んでください');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast('画像は8MB以下にしてください');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage({ dataUrl: reader.result, mimeType: file.type, name: file.name });
      setAnalyzedAssignments([]);
    };
    reader.onerror = () => showToast('画像を読み込めませんでした');
    reader.readAsDataURL(file);
  };

  const analyzeSelectedImage = async () => {
    if (!selectedImage) {
      showToast('解析する写真を選んでください');
      return;
    }
    setIsParsing(true);
    setAnalyzedAssignments([]);
    try {
      const apiBase = (import.meta.env.VITE_ASSIGNMENT_API_URL || window.location.origin).replace(/\/$/, '');
      const response = await fetch(`${apiBase}/api/assignments/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: selectedImage.dataUrl, mimeType: selectedImage.mimeType }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `解析に失敗しました (${response.status})`);
      setAnalyzedAssignments((result.assignments || []).map((item) => ({
        subject: item.subject || 'その他',
        title: item.title || '',
        due_date: item.due_date || '',
        note: item.note || '',
      })));
      if (!result.assignments?.length) showToast('課題を読み取れませんでした。写真を確認してください');
    } catch (error) {
      console.error('Assignment photo analysis failed:', error);
      showToast(error.message || '画像解析に失敗しました');
    } finally {
      setIsParsing(false);
    }
  };

  const saveAnalyzedAssignments = async () => {
    const items = analyzedAssignments.filter((item) => item.title.trim());
    if (!items.length) {
      showToast('課題名を確認してください');
      return;
    }
    try {
      await addAssignmentsToClass(items.map((item) => ({
        class_id: currentClassId,
        subject: item.subject,
        title: item.title.trim(),
        due_date: item.due_date || '',
        due_date_unknown: !item.due_date,
        created_at: new Date().toISOString(),
        source: 'photo-ai',
      })));
      setSelectedImage(null);
      setAnalyzedAssignments([]);
      setIsAddModalOpen(false);
      showToast(`${items.length}件を${currentClassObj?.name}の課題一覧に登録しました`);
    } catch (error) {
      console.error('Assignment save failed:', error);
      showToast('課題を登録できませんでした。通信状態を確認してください');
    }
  };

  const handleManualAddSubmit = async () => {
    const title = manualTitle.trim();
    if (!title) {
      showToast('課題名を入力してください');
      return;
    }

    setIsSavingManualAssignment(true);
    try {
      await addDoc(collection(db, 'assignments'), {
        class_id: currentClassId,
        subject: manualSubject,
        title,
        due_date: manualDueDate,
        created_at: new Date().toISOString(),
      });
      setManualTitle('');
      setIsAddModalOpen(false);
      showToast(`${currentClassObj?.name}に課題を追加しました`);
    } catch (error) {
      console.error('Firestore insert failed:', error);
      showToast('課題を保存できませんでした。通信状態を確認してください');
    } finally {
      setIsSavingManualAssignment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-24 max-w-md mx-auto shadow-2xl relative border-x border-slate-200">
      
      {/* トースト通知 */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-slate-900/90 backdrop-blur-md text-white text-xs font-medium py-3 px-4 rounded-2xl shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ==================== 1. トップ画面: クラス選択 (ルート /) ==================== */}
      {!currentClassId ? (
        <div className="p-4 space-y-5">
          {/* ヘッダーカード */}
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center mb-3">
              <span className="text-[10px] font-extrabold bg-white/20 px-2.5 py-1 rounded-full text-indigo-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                登録・ログイン一切不要
              </span>
            </div>

            <h1 className="text-2xl font-black tracking-tight mb-1">ClassBoard</h1>
            <p className="text-xs text-indigo-200 leading-relaxed">
              LINEで共有してクラスの課題を確認・管理できます。
            </p>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-indigo-200">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-300" />
                全8クラス完全分離
              </span>
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                リアルタイム全員同期
              </span>
            </div>
          </div>

          {/* クラス選択グリッド */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>クラスを選択してください</span>
              </h2>
              <span className="text-xs font-bold text-slate-400">1年生 (全8組)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CLASSES.map((cls) => {
                const count = (remoteAssignments[cls.id] || []).length;
                return (
                  <button
                    key={cls.id}
                    onClick={() => navigateToClass(cls.id)}
                    className="bg-white hover:bg-slate-50 border border-slate-200/80 p-4 rounded-2xl shadow-sm hover:shadow-md transition text-left relative overflow-hidden group active:scale-98"
                  >
                    <div className={`h-1.5 w-full bg-gradient-to-r ${cls.color} absolute top-0 left-0`} />

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition">
                        {cls.name}
                      </span>
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold group-hover:bg-indigo-600 group-hover:text-white transition">
                        →
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
                      <span>登録課題</span>
                      <span className={`font-bold ${count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {count} 件
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* アプリの特徴カード */}
          <div className="bg-slate-200/60 rounded-2xl p-4 text-xs space-y-2 text-slate-600">
            <p className="font-bold text-slate-800">💡 アプリの使い方</p>
            <ol className="list-decimal list-inside space-y-1 leading-relaxed">
              <li>自分のクラスを選択し、LINE共有ボタンで専用URLをクラスLINEに貼り付け</li>
              <li>課題一覧で提出期限や完了状況を確認</li>
              <li>自分だけの「終わったチェック（☑️）」は自分のスマホにだけ保存されます</li>
            </ol>
          </div>
        </div>
      ) : (

        /* ==================== 2. 特定クラスの個別ボード画面 ( /class/1-X ) ==================== */
        <div>
          {/* ヘッダー & ナビゲーション */}
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <button
                  onClick={navigateToHome}
                  className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition shrink-0"
                  title="クラス一覧へ戻る"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-base font-black text-slate-900 truncate">
                      {currentClassObj?.name} 課題ボード
                    </h1>
                  </div>
                  <p className={`text-[10px] font-bold flex items-center gap-1 ${cloudSyncStatus === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cloudSyncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'} ${cloudSyncStatus === 'connected' ? 'animate-pulse' : ''}`} />
                    {cloudSyncStatus === 'connecting' ? '共有データベースに接続中...' : cloudSyncStatus === 'connected' ? 'Firestoreリアルタイム同期中' : '共有データベースに接続できません'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleShareCurrentClass}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-md shadow-indigo-200 shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>クラス用URLコピー</span>
              </button>
            </div>

            {/* タブ切り替え */}
            <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl mt-3 text-[11px] sm:text-xs font-bold">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'assignments' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>課題一覧 ({currentAssignments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'calendar' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>年間カレンダー</span>
              </button>

              <button
                onClick={() => setActiveTab('timetable')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'timetable' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>週間時間割</span>
              </button>
            </div>
          </header>

          <main className="p-4 space-y-5">
            {activeTab === 'assignments' && (
              <>
                {/* 優先課題ハイライト */}
                {highlightedAssignments.length > 0 && (
                  <section className="bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 p-0.5 rounded-2xl shadow-lg shadow-rose-200/50">
                    <div className="bg-white rounded-[14px] p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                          <Zap className="w-4 h-4 text-amber-500 fill-amber-400 animate-bounce" />
                          <span>要チェック！直近＆明日授業の課題</span>
                        </div>
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                          {highlightedAssignments.length}件
                        </span>
                      </div>

                      <div className="space-y-2">
                        {highlightedAssignments.map(item => {
                          const daysLeft = getDaysLeft(item.due_date);
                          const isTomorrowSubject = tomorrowSubjects.includes(item.subject);
                          const isCompleted = completedIds.includes(item.id);

                          return (
                            <div 
                              key={item.id}
                              className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                            >
                              <button 
                                onClick={() => toggleComplete(item.id)}
                                className="mt-0.5 text-slate-300 hover:text-emerald-500 transition shrink-0"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                                ) : (
                                  <Circle className="w-5 h-5" />
                                )}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SUBJECT_COLORS[item.subject]?.bg || 'bg-slate-100'} ${SUBJECT_COLORS[item.subject]?.text || 'text-slate-700'}`}>
                                    {item.subject}
                                  </span>
                                  {daysLeft <= 0 && (
                                    <span className="text-[10px] font-extrabold bg-red-600 text-white px-1.5 py-0.5 rounded">
                                      今日まで！
                                    </span>
                                  )}
                                  {daysLeft === 1 && (
                                    <span className="text-[10px] font-extrabold bg-amber-500 text-white px-1.5 py-0.5 rounded">
                                      明日提出
                                    </span>
                                  )}
                                  {isTomorrowSubject && (
                                    <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <Sparkles className="w-2.5 h-2.5" />
                                      明日の授業！
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                                  {item.title}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {/* 教科別フィルター */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[11px] font-bold text-slate-400 pl-1 shrink-0">
                    <Filter className="w-3 h-3" />
                  </span>
                  {['すべて', '英語', '数学', '国語', '理科', '社会', '情報', 'その他'].map(sub => (
                    <button
                      key={sub}
                      onClick={() => setFilterSubject(sub)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        filterSubject === sub 
                          ? 'bg-slate-900 text-white shadow-sm scale-105' 
                          : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>

                {/* 課題一覧リスト */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {filterSubject === 'すべて' ? 'クラス共有課題' : `${filterSubject}の課題`}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {sortedAssignments.length} 件
                    </span>
                  </div>

                  {sortedAssignments.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">登録された課題はありません</h3>
                      <p className="text-xs text-slate-400 mt-1">「＋」ボタンから追加すると、{currentClassObj?.name}全員に即座に同期されます</p>
                    </div>
                  ) : (
                    sortedAssignments.map(item => {
                      const isCompleted = completedIds.includes(item.id);
                      const daysLeft = getDaysLeft(item.due_date);
                      const isTomorrowSubject = tomorrowSubjects.includes(item.subject);
                      const colorConfig = SUBJECT_COLORS[item.subject] || SUBJECT_COLORS['その他'];

                      return (
                        <div 
                          key={item.id}
                          className={`bg-white rounded-2xl p-3.5 border transition-all shadow-sm relative overflow-hidden ${
                            isCompleted ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-200/80'
                          }`}
                        >
                          <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${colorConfig.tagBg}`} />

                          <div className="flex items-start gap-3 pl-1">
                            {/* 個人用完了チェック */}
                            <button 
                              onClick={() => toggleComplete(item.id)}
                              className="mt-0.5 text-slate-300 hover:text-emerald-500 transition shrink-0"
                              title="自分だけのチェック状態を変更"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-50" />
                              ) : (
                                <Circle className="w-6 h-6" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${colorConfig.bg} ${colorConfig.text}`}>
                                  {item.subject}
                                </span>

                                {!isCompleted && (
                                  <>
                                    {daysLeft === 0 && (
                                      <span className="text-[10px] font-extrabold bg-rose-600 text-white px-2 py-0.5 rounded-md animate-pulse">
                                        今日まで！
                                      </span>
                                    )}
                                    {daysLeft === 1 && (
                                      <span className="text-[10px] font-extrabold bg-amber-500 text-white px-2 py-0.5 rounded-md">
                                        あと1日 (明日)
                                      </span>
                                    )}
                                    {daysLeft > 1 && (
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                        あと{daysLeft}日
                                      </span>
                                    )}
                                    {isTomorrowSubject && (
                                      <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                                        明日の授業！
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>

                              <p className={`text-sm font-bold mt-1.5 leading-snug ${
                                isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                              }`}>
                                {item.title}
                              </p>

                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                                <div className="flex items-center gap-1 font-medium">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>提出期限: {item.due_date || '未確認'}</span>
                                </div>

                                <button
                                  onClick={() => deleteAssignmentFromClass(item.id)}
                                  className="text-slate-300 hover:text-rose-500 transition p-1"
                                  title="クラウドから削除 (全員の画面から消えます)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* 年間カレンダー */}
            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <section className="rounded-2xl bg-indigo-900 p-4 text-white shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-extrabold">{currentClassObj?.name} 課題カレンダー</h2>
                      <p className="mt-1 text-xs text-indigo-200">期限が登録された課題を年間・月間で確認できます</p>
                    </div>
                    <div className="flex shrink-0 rounded-lg bg-white/10 p-1 text-[11px] font-bold">
                      <button onClick={() => setCalendarView('year')} className={`rounded-md px-2.5 py-1.5 ${calendarView === 'year' ? 'bg-white text-indigo-800' : 'text-white'}`}>年一覧</button>
                      <button onClick={() => setCalendarView('month')} className={`rounded-md px-2.5 py-1.5 ${calendarView === 'month' ? 'bg-white text-indigo-800' : 'text-white'}`}>月表示</button>
                    </div>
                  </div>
                </section>

                {calendarView === 'year' ? (
                  <>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <button aria-label="前年" onClick={() => changeCalendarYear(-1)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></button>
                      <div className="text-center">
                        <p className="text-lg font-black text-slate-900">{calendarYear}年</p>
                        <p className="text-[11px] text-slate-500">期限あり {assignmentsInCalendarYear.length}件</p>
                      </div>
                      <button aria-label="翌年" onClick={() => changeCalendarYear(1)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4 rotate-180" /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {Array.from({ length: 12 }, (_, monthIndex) => {
                        const firstWeekday = new Date(calendarYear, monthIndex, 1).getDay();
                        const daysInMonth = new Date(calendarYear, monthIndex + 1, 0).getDate();
                        const monthPrefix = `${calendarYear}-${String(monthIndex + 1).padStart(2, '0')}-`;
                        const monthAssignments = assignmentsInCalendarYear.filter((item) => item.due_date.startsWith(monthPrefix));
                        return (
                          <button
                            key={monthIndex}
                            onClick={() => {
                              setCalendarMonth(monthIndex);
                              setCalendarDate(`${calendarYear}-${String(monthIndex + 1).padStart(2, '0')}-01`);
                              setCalendarView('month');
                            }}
                            className="rounded-xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-800">{monthIndex + 1}月</span>
                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${monthAssignments.length ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>{monthAssignments.length}件</span>
                            </div>
                            <div className="grid grid-cols-7 gap-y-1 text-center text-[8px] leading-3 text-slate-400">
                              {['日', '月', '火', '水', '木', '金', '土'].map((day) => <span key={day} className="font-bold">{day}</span>)}
                              {Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} />)}
                              {Array.from({ length: daysInMonth }, (_, index) => {
                                const day = index + 1;
                                const date = `${monthPrefix}${String(day).padStart(2, '0')}`;
                                const count = (assignmentsByDueDate[date] || []).length;
                                return <span key={day} className={`relative rounded-sm ${count ? 'bg-indigo-100 font-extrabold text-indigo-700' : 'text-slate-500'}`}>{day}</span>;
                              })}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {currentAssignments.some((item) => !/^\d{4}-\d{2}-\d{2}$/.test(item.due_date || '')) && (
                      <section className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <h3 className="text-xs font-extrabold text-amber-900">期限未確認</h3>
                        <p className="mt-1 text-[10px] text-amber-800">期限が未入力の課題は日付の枠に表示できないため、ここに表示します。</p>
                        <div className="mt-2 space-y-2">
                          {currentAssignments.filter((item) => !/^\d{4}-\d{2}-\d{2}$/.test(item.due_date || '')).map((item) => (
                            <div key={item.id} className="rounded-lg bg-white/80 px-3 py-2 text-xs text-slate-700">
                              <span className="mr-2 font-bold text-amber-800">{item.subject}</span>{item.title}
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <button aria-label="前の月" onClick={() => changeCalendarMonth(-1)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></button>
                      <div className="text-center">
                        <p className="text-lg font-black text-slate-900">{calendarYear}年{calendarMonth + 1}月</p>
                        <p className="text-[11px] text-slate-500">{assignmentsInCalendarYear.filter((item) => item.due_date.startsWith(`${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-`)).length}件の課題</p>
                      </div>
                      <button aria-label="次の月" onClick={() => changeCalendarMonth(1)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4 rotate-180" /></button>
                    </div>

                    <section className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
                          <div key={day} className={`py-1.5 text-[10px] font-extrabold ${index === 0 ? 'text-rose-500' : index === 6 ? 'text-blue-500' : 'text-slate-500'}`}>{day}</div>
                        ))}
                        {calendarMonthCells.map((day, index) => {
                          if (!day) return <div key={`empty-${index}`} className="min-h-[58px] rounded-lg bg-slate-50/60 sm:min-h-[72px]" />;
                          const date = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const dayAssignments = assignmentsByDueDate[date] || [];
                          const isSelected = calendarDate === date;
                          const isToday = todayDateStr === date;
                          return (
                            <button
                              key={date}
                              onClick={() => setCalendarDate(date)}
                              aria-label={`${calendarYear}年${calendarMonth + 1}月${day}日、課題${dayAssignments.length}件`}
                              className={`min-h-[58px] rounded-lg border p-1 text-left transition sm:min-h-[72px] ${isSelected ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-300' : 'border-transparent bg-white hover:bg-slate-50'}`}
                            >
                              <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isToday ? 'bg-rose-500 text-white' : 'text-slate-700'}`}>{day}</span>
                              {dayAssignments.length > 0 && <span className="mt-1 block truncate rounded bg-indigo-100 px-1 py-0.5 text-center text-[8px] font-extrabold text-indigo-700">{dayAssignments.length}件</span>}
                              {dayAssignments.length > 0 && <span className="mt-1 flex justify-center gap-0.5">{dayAssignments.slice(0, 3).map((item) => <i key={item.id} className={`h-1 w-1 rounded-full ${SUBJECT_COLORS[item.subject]?.tagBg || 'bg-slate-500'}`} />)}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </section>

                    <section className="space-y-2">
                      <h3 className="px-1 text-xs font-extrabold text-slate-700">{calendarDate.replaceAll('-', '/')} の課題</h3>
                      {assignmentsOnCalendarDate.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs text-slate-400">この日の課題はありません</div>
                      ) : assignmentsOnCalendarDate.map((item) => (
                        <div key={item.id} className={`flex items-start gap-3 rounded-xl border bg-white p-3 ${completedIds.includes(item.id) ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
                          <button onClick={() => toggleComplete(item.id)} aria-label={completedIds.includes(item.id) ? '未完了に戻す' : '完了にする'} className="mt-0.5 shrink-0">
                            {completedIds.includes(item.id) ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-300" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${SUBJECT_COLORS[item.subject]?.bg || 'bg-slate-100'} ${SUBJECT_COLORS[item.subject]?.text || 'text-slate-700'}`}>{item.subject}</span>
                            <p className={`mt-1.5 text-sm font-bold ${completedIds.includes(item.id) ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.title}</p>
                          </div>
                        </div>
                      ))}
                    </section>
                  </>
                )}
              </div>
            )}

            {/* 時間割タブ */}
            {activeTab === 'timetable' && (
              <div className="space-y-4">
                <div className="bg-indigo-900 text-white rounded-2xl p-4 shadow-lg">
                  <h2 className="text-base font-extrabold">{currentClassObj?.name} 週間時間割</h2>
                  <p className="text-xs text-indigo-200 mt-1">各時間を選んで変更できます。授業がない時間は「空欄」を選んでください。</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm overflow-x-auto">
                  <div className="grid grid-cols-6 gap-1 min-w-[320px] text-center">
                    <div className="py-2 text-[10px] font-bold text-slate-400 bg-slate-50 rounded">時限</div>
                    {WEEKDAYS.map(day => {
                      const isTomorrow = day.key === tomorrowDayKey;
                      return (
                        <div key={day.key} className={`py-2 text-xs font-extrabold rounded ${isTomorrow ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                          {day.label}
                          {isTomorrow && <span className="block text-[8px] leading-none mt-0.5">明日</span>}
                        </div>
                      );
                    })}

                    {[0, 1, 2, 3, 4, 5].map(periodIndex => (
                      <React.Fragment key={periodIndex}>
                        <div className="py-3 text-xs font-extrabold text-slate-400 flex items-center justify-center bg-slate-50 rounded">
                          {periodIndex + 1}
                        </div>
                        {WEEKDAYS.map(day => {
                          const subject = timetableDraft[day.key]?.[periodIndex] || '';
                          const colorConfig = SUBJECT_COLORS[subject] || SUBJECT_COLORS['その他'];

                          return (
                            <button
                              key={day.key + periodIndex}
                              aria-label={`${day.label}曜日 ${periodIndex + 1}時限: ${subject || '空欄'}。タップして変更`}
                              onClick={() => setEditingTimetableSlot({ dayKey: day.key, dayLabel: day.label, periodIndex })}
                              className={`py-2.5 px-1 rounded text-xs font-bold flex items-center justify-center min-h-10 ${
                                subject ? colorConfig.bg + ' ' + colorConfig.text : 'bg-slate-50 text-slate-300'
                              }`}
                            >
                              <span className="text-[10px] leading-tight whitespace-normal break-words">{subject || '空欄'}</span>
                            </button>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {editingTimetableSlot && (
                  <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-4" onClick={() => setEditingTimetableSlot(null)}>
                    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-4 max-h-[45vh] flex flex-col" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 shrink-0">
                        <h3 className="text-sm font-extrabold text-slate-900">{editingTimetableSlot.dayLabel}曜日 {editingTimetableSlot.periodIndex + 1}時限</h3>
                        <button onClick={() => setEditingTimetableSlot(null)} className="text-xs font-bold text-slate-500 px-2 py-1">閉じる</button>
                      </div>
                      <div className="flex-1 overflow-y-auto min-h-0">
                        {TIMETABLE_SUBJECT_OPTIONS.map((subject, index) => (
                          <button
                            key={subject || `blank-${index}`}
                            onClick={() => {
                              const { dayKey, periodIndex } = editingTimetableSlot;
                              setTimetableDraft(previous => ({
                                ...previous,
                                [dayKey]: previous[dayKey].map((value, slotIndex) => slotIndex === periodIndex ? subject : value),
                              }));
                              setEditingTimetableSlot(null);
                            }}
                            className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-indigo-50 active:bg-indigo-100"
                          >
                            {subject || '空欄（授業なし）'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={saveTimetable}
                  disabled={isSavingTimetable || cloudSyncStatus !== 'connected'}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold py-3 rounded-xl shadow-md transition"
                >
                  {isSavingTimetable ? '保存中...' : '時間割を保存'}
                </button>
              </div>
            )}
          </main>

          {/* 固定課題追加ボタン */}
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4 pointer-events-none">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="pointer-events-auto w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-5 rounded-2xl shadow-xl shadow-slate-900/30 flex items-center justify-center gap-2 active:scale-98 transition transform"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                <Plus className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-sm">{currentClassObj?.name} に課題を追加</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================== モーダル: 課題追加 ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{currentClassObj?.name} 専用課題追加</h3>
                  <p className="text-[11px] text-slate-400">課題の内容と提出日を入力してください</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800">写真からAIで課題を読み取る</h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">黒板・プリント・Teamsのスクリーンショットを選びます。AIの結果を確認してから登録できます。</p>
                </div>
                <label
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => { event.preventDefault(); handleImageSelected(event.dataTransfer.files?.[0]); }}
                  className="block cursor-pointer rounded-xl border-2 border-dashed border-indigo-200 bg-white p-4 text-center hover:border-indigo-400"
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => { handleImageSelected(event.target.files?.[0]); event.target.value = ''; }}
                  />
                  {selectedImage ? (
                    <div className="space-y-2">
                      <img src={selectedImage.dataUrl} alt="解析する写真" className="mx-auto max-h-48 rounded-lg object-contain" />
                      <p className="text-xs font-semibold text-slate-600">{selectedImage.name}</p>
                      <p className="text-[11px] text-indigo-600">クリックまたはドロップして写真を変更</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      <FileText className="mx-auto mb-2 h-6 w-6 text-indigo-500" />
                      <p className="text-xs font-bold text-slate-700">写真を選択、またはここにドロップ</p>
                      <p className="mt-1 text-[10px] text-slate-400">JPEG / PNG / WebP・8MB以下</p>
                    </div>
                  )}
                </label>
                <button
                  type="button"
                  onClick={analyzeSelectedImage}
                  disabled={!selectedImage || isParsing}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isParsing ? 'AIが写真を解析しています…' : '写真をAI解析'}
                </button>
                {analyzedAssignments.length > 0 && (
                  <div className="space-y-3 border-t border-indigo-100 pt-3">
                    <p className="text-xs font-bold text-slate-700">解析結果を確認・修正してください（期限不明は空欄です）</p>
                    {analyzedAssignments.map((item, index) => (
                      <div key={index} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                        <select
                          value={item.subject}
                          onChange={(event) => setAnalyzedAssignments((previous) => previous.map((entry, i) => i === index ? { ...entry, subject: event.target.value } : entry))}
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                        >
                          {['英語', '数学', '国語', '理科', '社会', '情報', 'その他'].map((subject) => <option key={subject}>{subject}</option>)}
                        </select>
                        <input
                          value={item.title}
                          onChange={(event) => setAnalyzedAssignments((previous) => previous.map((entry, i) => i === index ? { ...entry, title: event.target.value } : entry))}
                          placeholder="課題名"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs"
                        />
                        <label className="block text-[11px] text-slate-500">提出期限（不明なら空欄）
                          <input
                            type="date"
                            value={item.due_date}
                            onChange={(event) => setAnalyzedAssignments((previous) => previous.map((entry, i) => i === index ? { ...entry, due_date: event.target.value } : entry))}
                            className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs"
                          />
                        </label>
                        {item.note && <p className="text-[10px] text-amber-700">確認: {item.note}</p>}
                      </div>
                    ))}
                    <button type="button" onClick={saveAnalyzedAssignments} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">
                      確認した課題を一覧に登録
                    </button>
                  </div>
                )}
                <p className="text-[10px] leading-4 text-slate-400">写真はAI解析サービスへ送信されます。個人情報が写っていないか確認してください。</p>
              </section>

              <div className="flex items-center gap-3 py-1 text-[10px] font-bold text-slate-400"><span className="h-px flex-1 bg-slate-200" />または手入力<span className="h-px flex-1 bg-slate-200" /></div>
              <label className="block text-xs font-bold text-slate-700">
                教科
                <select value={manualSubject} onChange={(e) => setManualSubject(e.target.value)} className="mt-1 w-full text-sm font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50">
                  {['英語', '数学', '国語', '理科', '社会', '情報', 'その他'].map(subject => <option key={subject} value={subject}>{subject}</option>)}
                </select>
              </label>

              <label className="block text-xs font-bold text-slate-700">
                課題名
                <input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="例：ワーク p.20〜25" className="mt-1 w-full text-sm font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
              </label>

              <label className="block text-xs font-bold text-slate-700">
                提出日
                <input type="date" value={manualDueDate} onChange={(e) => setManualDueDate(e.target.value)} className="mt-1 w-full text-sm font-medium p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50" />
              </label>

              <button
                onClick={handleManualAddSubmit}
                disabled={isSavingManualAssignment}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSavingManualAssignment ? <span className="text-sm">保存中...</span> : <><Plus className="w-4 h-4" /><span className="text-sm">課題を追加</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
