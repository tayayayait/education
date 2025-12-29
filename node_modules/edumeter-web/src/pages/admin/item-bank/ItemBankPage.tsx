import React, { useEffect, useMemo, useState } from 'react';
import { createApiClient } from '../../../services/apiClient';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { ItemFormPanel } from './ItemFormPanel';
import { ItemListTable } from './ItemListTable';
import { ReviewQueueCard } from './ReviewQueueCard';
import { ItemFormState, ItemRow } from './types';

const api = createApiClient({ baseUrl: import.meta.env.VITE_API_BASE_URL });

const emptyForm: ItemFormState = {
  code: '',
  title: '',
  subject: '',
  grade: '',
  standardCode: '',
  standardDescription: '',
  purposeType: 'supplemental',
  stem: '',
  answer: ''
};

export const ItemBankPage: React.FC = () => {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<ItemFormState>(emptyForm);
  const [activeTab, setActiveTab] = useState('list');

  const hasId = Boolean(form.id);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterSubject) params.set('subject', filterSubject);
      if (filterGrade) params.set('grade', filterGrade);
      if (search) params.set('search', search);

      const data = await api.get<{ items: ItemRow[] }>(`/items?${params.toString()}`);
      setItems(data.items ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : '문항 목록을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const basePayload = {
      code: form.code,
      title: form.title,
      subject: form.subject,
      grade: form.grade,
      content: {
        standardCode: form.standardCode || undefined,
        standardDescription: form.standardDescription || undefined
      },
      purpose: {
        purposeType: form.purposeType || 'supplemental'
      }
    };

    try {
      if (hasId) {
        await api.put(`/items/${form.id}`, basePayload);
      } else {
        await api.post('/items', {
          ...basePayload,
          version: {
            versionNumber: 1,
            stem: form.stem,
            answer: form.answer
          }
        });
      }
      resetForm();
      setActiveTab('list');
      await fetchItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : '문항 저장에 실패했습니다.';
      setError(message);
    }
  };

  const handleSelectItem = (item: ItemRow) => {
    setForm({
      id: item.id,
      code: item.code,
      title: item.title,
      subject: item.subject,
      grade: item.grade,
      standardCode: item.standard_code ?? '',
      standardDescription: item.standard_description ?? '',
      purposeType: item.purpose_type ?? 'supplemental',
      stem: '',
      answer: '',
      status: item.status
    });
    setActiveTab('form');
  };

  const handleAction = async (id: string, action: string) => {
    try {
      await api.post(`/items/${id}/${action}`);
      await fetchItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : '상태 변경에 실패했습니다.';
      setError(message);
    }
  };

  const reviewQueue = useMemo(() => items.filter(item => item.status === 'review'), [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary">문항 운영</h3>
          <p className="text-sm text-text-secondary mt-2">
            문항 등록/검토/승인/배포 흐름을 관리합니다.
          </p>
        </div>
        <Button variant="secondary" onClick={fetchItems}>새로고침</Button>
      </div>

      {error && (
        <div className="rounded-sm border border-danger/20 bg-danger/10 text-danger text-sm p-3">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Input
          placeholder="검색(코드/제목)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input
          placeholder="과목"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        />
        <Input
          placeholder="학년"
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
        />
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">상태 전체</option>
          <option value="draft">초안</option>
          <option value="review">검토</option>
          <option value="approved">승인</option>
          <option value="published">배포</option>
          <option value="retired">폐기</option>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={fetchItems}>조회</Button>
        <Button variant="secondary" onClick={() => setActiveTab('form')}>새 문항 등록</Button>
      </div>

      <div className="space-y-6 lg:grid lg:grid-cols-[1.4fr_1fr] lg:gap-6 lg:space-y-0">
        <div className="space-y-6">
          <ReviewQueueCard count={reviewQueue.length} />
          <div className="lg:hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="list">문항 리스트</TabsTrigger>
                <TabsTrigger value="form">문항 등록/수정</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <ItemListTable
                  items={items}
                  loading={loading}
                  onSelect={handleSelectItem}
                  onAction={handleAction}
                />
              </TabsContent>
              <TabsContent value="form">
                <ItemFormPanel
                  form={form}
                  onChange={setForm}
                  onSubmit={handleSubmit}
                  onReset={resetForm}
                  isEditing={hasId}
                />
              </TabsContent>
            </Tabs>
          </div>
          <div className="hidden lg:block">
            <ItemListTable
              items={items}
              loading={loading}
              onSelect={handleSelectItem}
              onAction={handleAction}
            />
          </div>
        </div>
        <div className="hidden lg:block">
          <ItemFormPanel
            form={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            onReset={resetForm}
            isEditing={hasId}
          />
        </div>
      </div>
    </div>
  );
};
