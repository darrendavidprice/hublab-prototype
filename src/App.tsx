import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './routes/Home';
import { Find } from './routes/Find';
import { Calendar } from './routes/Calendar';
import { RecordDetail } from './routes/RecordDetail';
import { SubBrand } from './routes/SubBrand';
import { Admin } from './routes/Admin';
import { AdminRecordForm } from './routes/AdminRecordForm';
import { AdminImport } from './routes/AdminImport';
import { Privacy } from './routes/Privacy';
import { About } from './routes/About';

/** Placeholder for routes built in later phases, so navigation works now. */
function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <section style={{ background: 'var(--c-paper)' }}>
      <div className="container" style={{ paddingBlock: 'var(--s-8)' }}>
        <p className="pill">{phase}</p>
        <h1 style={{ fontSize: 'var(--fs-800)', marginTop: 'var(--s-3)' }}>{title}</h1>
        <p style={{ maxWidth: 'var(--maxw-text)' }}>
          This area is scaffolded and will be built in the phase shown above. The data layer and
          brand foundations it depends on are already in place.
        </p>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/find" element={<Find />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/record/:id" element={<RecordDetail />} />
        <Route path="/funlab" element={<SubBrand lab="funlab" />} />
        <Route path="/futurelab" element={<SubBrand lab="futurelab" />} />
        <Route path="/lifelab" element={<SubBrand lab="lifelab" />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/new" element={<AdminRecordForm />} />
        <Route path="/admin/import" element={<AdminImport />} />
        <Route path="/admin/edit/:id" element={<AdminRecordForm />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Placeholder title="Page not found" phase="Try the Home link" />} />
      </Routes>
    </Layout>
  );
}
