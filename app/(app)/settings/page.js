import { getCurrentShop } from '@/lib/shop';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const { shop } = await getCurrentShop();
  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.2rem' }}>Shop settings</h1>
      <SettingsForm shop={shop} />
    </div>
  );
}
