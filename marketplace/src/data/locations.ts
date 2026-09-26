import type { Province } from '../types';

// Cambodia's 25 provinces and municipalities. District lists cover the main
// districts and cities used for filtering; extend as needed.
export const PROVINCES: Province[] = [
  {
    slug: 'phnom-penh', name: { en: 'Phnom Penh', km: 'ភ្នំពេញ' },
    districts: ['Chamkar Mon', 'Boeng Keng Kang', 'Doun Penh', 'Prampir Meakkakra', 'Tuol Kouk', 'Dangkao', 'Mean Chey', 'Russey Keo', 'Sen Sok', 'Pou Senchey', 'Chroy Changvar', 'Prek Pnov', 'Chbar Ampov', 'Kamboul'],
  },
  {
    slug: 'kandal', name: { en: 'Kandal', km: 'កណ្ដាល' },
    districts: ['Ta Khmau', 'Kien Svay', 'Ang Snuol', 'Kandal Stueng', 'Khsach Kandal', 'Lvea Aem', 'Mukh Kampul', 'Ponhea Leu', "S'ang", 'Kaoh Thum'],
  },
  {
    slug: 'siem-reap', name: { en: 'Siem Reap', km: 'សៀមរាប' },
    districts: ['Siem Reap City', 'Angkor Thom', 'Banteay Srei', 'Prasat Bakong', 'Puok', 'Soutr Nikom', 'Chi Kraeng', 'Kralanh', 'Angkor Chum'],
  },
  {
    slug: 'battambang', name: { en: 'Battambang', km: 'បាត់ដំបង' },
    districts: ['Battambang City', 'Banan', 'Thma Koul', 'Bavel', 'Aek Phnum', 'Moung Ruessei', 'Sangkae', 'Samlout', 'Kamrieng'],
  },
  {
    slug: 'preah-sihanouk', name: { en: 'Sihanoukville', km: 'ព្រះសីហនុ' },
    districts: ['Sihanoukville City', 'Prey Nob', 'Stueng Hav', 'Kampong Seila', 'Kaoh Rung'],
  },
  {
    slug: 'kampong-cham', name: { en: 'Kampong Cham', km: 'កំពង់ចាម' },
    districts: ['Kampong Cham City', 'Batheay', 'Chamkar Leu', 'Cheung Prey', 'Kampong Siem', 'Kang Meas', 'Prey Chhor', 'Srei Santhor', 'Stueng Trang'],
  },
  {
    slug: 'kampot', name: { en: 'Kampot', km: 'កំពត' },
    districts: ['Kampot City', 'Angkor Chey', 'Banteay Meas', 'Chhuk', 'Chum Kiri', 'Dang Tong', 'Kampong Trach', 'Tuek Chhou'],
  },
  {
    slug: 'takeo', name: { en: 'Takeo', km: 'តាកែវ' },
    districts: ['Doun Kaev City', 'Angkor Borei', 'Bati', 'Borei Cholsar', 'Kiri Vong', 'Prey Kabbas', 'Samraong', 'Tram Kak', 'Treang'],
  },
  {
    slug: 'banteay-meanchey', name: { en: 'Banteay Meanchey', km: 'បន្ទាយមានជ័យ' },
    districts: ['Serei Saophoan City', 'Poipet City', 'Mongkol Borei', 'Phnum Srok', 'Preah Netr Preah', 'Ou Chrov', 'Thma Puok', 'Svay Chek', 'Malai'],
  },
  { slug: 'kep', name: { en: 'Kep', km: 'កែប' }, districts: ['Kep City', "Damnak Chang'aeur"] },
  { slug: 'kampong-speu', name: { en: 'Kampong Speu', km: 'កំពង់ស្ពឺ' }, districts: ['Chbar Mon City', 'Samraong Tong', 'Kong Pisei', 'Odongk', 'Phnum Sruoch'] },
  { slug: 'kampong-chhnang', name: { en: 'Kampong Chhnang', km: 'កំពង់ឆ្នាំង' }, districts: ['Kampong Chhnang City', 'Kampong Tralach', "Rolea B'ier"] },
  { slug: 'kampong-thom', name: { en: 'Kampong Thom', km: 'កំពង់ធំ' }, districts: ['Stueng Saen City', 'Baray', 'Kampong Svay', 'Santuk'] },
  { slug: 'koh-kong', name: { en: 'Koh Kong', km: 'កោះកុង' }, districts: ['Khemarak Phoumin City', 'Sre Ambel', 'Botum Sakor'] },
  { slug: 'kratie', name: { en: 'Kratie', km: 'ក្រចេះ' }, districts: ['Kratie City', 'Chhloung', 'Sambour', 'Snuol'] },
  { slug: 'mondulkiri', name: { en: 'Mondulkiri', km: 'មណ្ឌលគិរី' }, districts: ['Saen Monourom City', 'Pech Chenda', 'Kaev Seima'] },
  { slug: 'oddar-meanchey', name: { en: 'Oddar Meanchey', km: 'ឧត្ដរមានជ័យ' }, districts: ['Samraong City', 'Anlong Veaeng', 'Banteay Ampil'] },
  { slug: 'pailin', name: { en: 'Pailin', km: 'ប៉ៃលិន' }, districts: ['Pailin City', 'Sala Krau'] },
  { slug: 'preah-vihear', name: { en: 'Preah Vihear', km: 'ព្រះវិហារ' }, districts: ['Tbeng Meanchey City', 'Kulen', 'Choam Ksant'] },
  { slug: 'prey-veng', name: { en: 'Prey Veng', km: 'ព្រៃវែង' }, districts: ['Prey Veng City', 'Peam Ro', 'Kamchay Mear', 'Svay Antor'] },
  { slug: 'pursat', name: { en: 'Pursat', km: 'ពោធិ៍សាត់' }, districts: ['Pursat City', 'Bakan', 'Krakor'] },
  { slug: 'ratanakiri', name: { en: 'Ratanakiri', km: 'រតនគិរី' }, districts: ['Banlung City', 'Lumphat', 'O Chum'] },
  { slug: 'stung-treng', name: { en: 'Stung Treng', km: 'ស្ទឹងត្រែង' }, districts: ['Stung Treng City', 'Sesan', 'Siem Pang'] },
  { slug: 'svay-rieng', name: { en: 'Svay Rieng', km: 'ស្វាយរៀង' }, districts: ['Svay Rieng City', 'Bavet City', 'Chantrea', 'Romeas Haek'] },
  { slug: 'tbong-khmum', name: { en: 'Tbong Khmum', km: 'ត្បូងឃ្មុំ' }, districts: ['Suong City', 'Memot', 'Ponhea Kraek', 'Dambae'] },
];

/** Provinces featured on the home page "Browse by Location" section. */
export const MAJOR_PROVINCES = [
  'phnom-penh', 'kandal', 'siem-reap', 'battambang', 'preah-sihanouk',
  'kampong-cham', 'kampot', 'takeo', 'banteay-meanchey',
];

export const provinceBySlug = (slug: string) => PROVINCES.find((p) => p.slug === slug);
