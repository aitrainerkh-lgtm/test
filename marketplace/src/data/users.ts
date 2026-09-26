// SAMPLE DATA — fictional sellers and one demo account for development.
// These are not real people or businesses and were not taken from any website.
import type { Seller, User } from '../types';

export const SELLERS: Seller[] = [
  { id: 's1', name: 'Sokha Auto Trading', type: 'business', phone: '012 000 101', phone2: '098 000 101', telegram: 'sokha_auto_sample', province: 'phnom-penh', district: 'Sen Sok', joinedAt: '2019-03-14', verified: true, status: 'active', bio: 'Used and new cars with clear documents. Showroom open 8:00–18:00 every day.', avatarColor: '#1d6fb8' },
  { id: 's2', name: 'Dara Mobile Shop', type: 'business', phone: '010 000 202', telegram: 'dara_mobile_sample', province: 'phnom-penh', district: 'Tuol Kouk', joinedAt: '2020-07-02', verified: true, status: 'active', bio: 'Phones, tablets and accessories. All devices checked before sale.', avatarColor: '#0f9d7a' },
  { id: 's3', name: 'Tech Corner KH', type: 'business', phone: '015 000 303', email: 'sales@techcorner.example', province: 'phnom-penh', district: 'Chamkar Mon', joinedAt: '2021-01-20', verified: true, status: 'active', bio: 'Laptops, PCs, monitors and home electronics. Delivery in Phnom Penh.', avatarColor: '#5b4bc4' },
  { id: 's4', name: 'Angkor Home Realty', type: 'business', phone: '017 000 404', province: 'siem-reap', district: 'Siem Reap City', joinedAt: '2018-11-05', verified: true, status: 'active', bio: 'Houses, land and rentals in Siem Reap.', avatarColor: '#c2255c' },
  { id: 's5', name: 'Mekong Property Agency', type: 'business', phone: '011 000 505', phone2: '092 000 505', email: 'info@mekongproperty.example', province: 'phnom-penh', district: 'Boeng Keng Kang', joinedAt: '2017-06-18', verified: true, status: 'active', bio: 'Condos, apartments, shophouses and land across Phnom Penh and Kandal.', avatarColor: '#9c36b5' },
  { id: 's6', name: 'Chan Vicheka', type: 'individual', phone: '096 000 606', province: 'battambang', district: 'Battambang City', joinedAt: '2022-02-11', verified: false, status: 'active', avatarColor: '#e8590c' },
  { id: 's7', name: 'Sreymom Boutique', type: 'business', phone: '088 000 707', telegram: 'sreymom_boutique_sample', province: 'phnom-penh', district: 'Doun Penh', joinedAt: '2021-09-30', verified: false, status: 'active', bio: 'Clothes, bags and beauty products. Delivery nationwide.', avatarColor: '#ae3ec9' },
  { id: 's8', name: 'Kampot Fresh Farm', type: 'business', phone: '097 000 808', province: 'kampot', district: 'Kampot City', joinedAt: '2020-04-12', verified: true, status: 'active', bio: 'Pepper, durian, salt and other local products from Kampot.', avatarColor: '#e03131' },
  { id: 's9', name: 'HR Connect Cambodia', type: 'business', phone: '023 000 909', email: 'jobs@hrconnect.example', province: 'phnom-penh', district: 'Chamkar Mon', joinedAt: '2016-08-22', verified: true, status: 'active', bio: 'Recruitment for companies in Cambodia.', avatarColor: '#2b8a3e' },
  { id: 's10', name: 'Rithy Home Services', type: 'business', phone: '069 000 110', province: 'kandal', district: 'Ta Khmau', joinedAt: '2022-05-03', verified: false, status: 'active', bio: 'Air-con cleaning, repair, moving and cleaning services.', avatarColor: '#e67700' },
  { id: 's11', name: 'Happy Paws Pet Shop', type: 'business', phone: '081 000 111', province: 'phnom-penh', district: 'Sen Sok', joinedAt: '2021-12-01', verified: true, status: 'active', bio: 'Healthy pets with vaccination records, pet food and supplies.', avatarColor: '#f08c00' },
  { id: 's12', name: 'Visal Chea', type: 'individual', phone: '093 000 112', province: 'preah-sihanouk', district: 'Sihanoukville City', joinedAt: '2023-03-19', verified: false, status: 'active', avatarColor: '#1098ad' },
  { id: 's13', name: 'Lina Keo', type: 'individual', phone: '070 000 113', province: 'takeo', district: 'Doun Kaev City', joinedAt: '2024-01-08', verified: false, status: 'active', avatarColor: '#d6336c' },
  { id: 's14', name: 'Demo User', type: 'individual', phone: '012 000 999', telegram: 'demo_user_sample', province: 'phnom-penh', district: 'Tuol Kouk', joinedAt: '2025-06-01', verified: false, status: 'active', bio: 'Demo account for testing the marketplace.', avatarColor: '#0a5c8c' },
];

/** Built-in demo account. Password: demo1234 */
export const DEMO_USER: User = {
  id: 'u-demo',
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '012 000 999',
  passwordHash: 'b3013916e74003ff823d4662b173a7e22242471292a50357f37bf6df8a261187',
  province: 'phnom-penh',
  district: 'Tuol Kouk',
  telegram: 'demo_user_sample',
  bio: 'Demo account for testing the marketplace.',
  joinedAt: '2025-06-01',
  sellerId: 's14',
};

export const DEMO_PASSWORD = 'demo1234';
