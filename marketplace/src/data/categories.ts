import type { Category, SpecField } from '../types';

// Reusable field definitions -------------------------------------------------

const brand = (options: string[], onCard = true): SpecField => ({
  key: 'brand', label: { en: 'Brand', km: 'ម៉ាក' }, type: 'select', options, filterable: true, onCard,
});
const model: SpecField = { key: 'model', label: { en: 'Model', km: 'ម៉ូដែល' }, type: 'text', onCard: true };
const color: SpecField = { key: 'color', label: { en: 'Color', km: 'ពណ៌' }, type: 'text' };
const warranty: SpecField = {
  key: 'warranty', label: { en: 'Warranty', km: 'ធានា' }, type: 'select',
  options: ['No warranty', '1 month', '3 months', '6 months', '1 year', '2 years'],
};

// Categories ----------------------------------------------------------------

export const CATEGORIES: Category[] = [
  {
    slug: 'cars-vehicles',
    name: { en: 'Cars & Vehicles', km: 'រថយន្ត និងយានយន្ត' },
    icon: 'car',
    color: '#1d6fb8',
    hasCondition: true,
    hasDealType: true,
    subcategories: [
      {
        slug: 'cars', name: { en: 'Cars', km: 'រថយន្ត' },
        fields: [{
          key: 'bodyType', label: { en: 'Body type', km: 'ប្រភេទតួ' }, type: 'select',
          options: ['Sedan', 'SUV', 'Pickup', 'Van', 'Hatchback', 'Coupe'], filterable: true,
        }],
      },
      { slug: 'motorbikes', name: { en: 'Motorbikes', km: 'ម៉ូតូ' } },
      { slug: 'tuk-tuk', name: { en: 'Tuk Tuk & Remork', km: 'Tuk Tuk និងរ៉ឺម៉ក' } },
      { slug: 'trucks', name: { en: 'Trucks & Heavy Machinery', km: 'ឡានដឹកទំនិញ និងគ្រឿងចក្រ' } },
      { slug: 'bicycles', name: { en: 'Bicycles & E-bikes', km: 'កង់ និងកង់អគ្គិសនី' } },
      { slug: 'vehicle-parts', name: { en: 'Parts & Accessories', km: 'គ្រឿងបន្លាស់យានយន្ត' } },
    ],
    fields: [
      brand(['Toyota', 'Lexus', 'Honda', 'Ford', 'Hyundai', 'Kia', 'Mazda', 'Nissan', 'Mitsubishi', 'Mercedes-Benz', 'BMW', 'Suzuki', 'Yamaha', 'BYD', 'Isuzu', 'Other']),
      model,
      { key: 'year', label: { en: 'Year', km: 'ឆ្នាំ' }, type: 'number', onCard: true },
      { key: 'fuel', label: { en: 'Fuel type', km: 'ប្រភេទឥន្ធនៈ' }, type: 'select', options: ['Petrol', 'Diesel', 'Hybrid', 'Electric'], filterable: true },
      { key: 'transmission', label: { en: 'Transmission', km: 'ប្រអប់លេខ' }, type: 'select', options: ['Automatic', 'Manual'], filterable: true },
      { key: 'mileage', label: { en: 'Mileage', km: 'ចម្ងាយបានបើក' }, type: 'number', unit: 'km', onCard: true },
      color,
      { key: 'documents', label: { en: 'Documents', km: 'ឯកសារ' }, type: 'select', options: ['Plate & card', 'Tax paper', 'No documents'] },
    ],
  },
  {
    slug: 'phones-tablets',
    name: { en: 'Phones & Tablets', km: 'ទូរស័ព្ទ និង Tablet' },
    icon: 'phone',
    color: '#0f9d7a',
    hasCondition: true,
    hasDealType: false,
    subcategories: [
      { slug: 'mobile-phones', name: { en: 'Mobile Phones', km: 'ទូរស័ព្ទដៃ' } },
      { slug: 'tablets', name: { en: 'Tablets', km: 'Tablet' } },
      { slug: 'smart-watches', name: { en: 'Smart Watches', km: 'នាឡិកាឆ្លាតវៃ' } },
      { slug: 'phone-accessories', name: { en: 'Phone Accessories', km: 'គ្រឿងបន្លាស់ទូរស័ព្ទ' } },
    ],
    fields: [
      brand(['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'vivo', 'Huawei', 'Google', 'realme', 'Other']),
      model,
      { key: 'storage', label: { en: 'Storage', km: 'ទំហំផ្ទុក' }, type: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'], filterable: true, onCard: true },
      { key: 'ram', label: { en: 'RAM', km: 'RAM' }, type: 'select', options: ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB'] },
      color,
      warranty,
    ],
  },
  {
    slug: 'computers',
    name: { en: 'Computers & Accessories', km: 'កុំព្យូទ័រ និងគ្រឿងបន្លាស់' },
    icon: 'laptop',
    color: '#5b4bc4',
    hasCondition: true,
    hasDealType: false,
    subcategories: [
      { slug: 'laptops', name: { en: 'Laptops', km: 'កុំព្យូទ័រយួរដៃ' } },
      { slug: 'desktops', name: { en: 'Desktops', km: 'កុំព្យូទ័រលើតុ' } },
      { slug: 'monitors', name: { en: 'Monitors', km: 'អេក្រង់' } },
      { slug: 'printers', name: { en: 'Printers & Scanners', km: 'ម៉ាស៊ីនបោះពុម្ព និងស្កេន' } },
      { slug: 'computer-parts', name: { en: 'Parts & Accessories', km: 'គ្រឿងបន្លាស់កុំព្យូទ័រ' } },
    ],
    fields: [
      brand(['Apple', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'MSI', 'Canon', 'Epson', 'LG', 'Samsung', 'Logitech', 'Other']),
      model,
      { key: 'processor', label: { en: 'Processor', km: 'Processor' }, type: 'text', onCard: true },
      { key: 'ram', label: { en: 'RAM', km: 'RAM' }, type: 'select', options: ['4GB', '8GB', '16GB', '32GB', '64GB'], filterable: true },
      { key: 'storage', label: { en: 'Storage', km: 'ទំហំផ្ទុក' }, type: 'text' },
      { key: 'screen', label: { en: 'Screen size', km: 'ទំហំអេក្រង់' }, type: 'text' },
      warranty,
    ],
  },
  {
    slug: 'electronics',
    name: { en: 'Electronics & Appliances', km: 'គ្រឿងអេឡិចត្រូនិក និងគ្រឿងប្រើប្រាស់' },
    icon: 'tv',
    color: '#d9480f',
    hasCondition: true,
    hasDealType: false,
    subcategories: [
      { slug: 'tvs', name: { en: 'TVs', km: 'ទូរទស្សន៍' } },
      { slug: 'audio', name: { en: 'Audio & Speakers', km: 'ឧបករណ៍សំឡេង' } },
      { slug: 'cameras', name: { en: 'Cameras & Drones', km: 'កាមេរ៉ា និង Drone' } },
      { slug: 'air-conditioners', name: { en: 'Air Conditioners', km: 'ម៉ាស៊ីនត្រជាក់' } },
      { slug: 'refrigerators', name: { en: 'Refrigerators', km: 'ទូទឹកកក' } },
      { slug: 'washing-machines', name: { en: 'Washing Machines', km: 'ម៉ាស៊ីនបោកខោអាវ' } },
      { slug: 'kitchen-appliances', name: { en: 'Kitchen Appliances', km: 'ឧបករណ៍ផ្ទះបាយ' } },
      { slug: 'gaming', name: { en: 'Gaming Consoles', km: 'ម៉ាស៊ីនហ្គេម' } },
    ],
    fields: [
      brand(['Samsung', 'LG', 'Sony', 'Panasonic', 'Sharp', 'Toshiba', 'Daikin', 'Midea', 'Canon', 'Nikon', 'DJI', 'JBL', 'Nintendo', 'Other']),
      model,
      { key: 'size', label: { en: 'Size / Capacity', km: 'ទំហំ / ចំណុះ' }, type: 'text', onCard: true },
      { key: 'power', label: { en: 'Power', km: 'កម្លាំង' }, type: 'text' },
      warranty,
    ],
  },
  {
    slug: 'house-land',
    name: { en: 'House & Land', km: 'ផ្ទះ និងដី' },
    icon: 'house',
    color: '#c2255c',
    hasCondition: false,
    hasDealType: true,
    subcategories: [
      { slug: 'houses', name: { en: 'Houses & Villas', km: 'ផ្ទះ និងវីឡា' } },
      { slug: 'flats', name: { en: 'Flats & Borey Houses', km: 'ផ្ទះល្វែង និងផ្ទះបុរី' } },
      { slug: 'apartments', name: { en: 'Apartments & Condos', km: 'Apartment និង Condo' } },
      { slug: 'land', name: { en: 'Land', km: 'ដី' } },
      { slug: 'rooms', name: { en: 'Rooms for Rent', km: 'បន្ទប់ជួល' } },
      { slug: 'commercial', name: { en: 'Shophouses & Commercial', km: 'អគារពាណិជ្ជកម្ម' } },
    ],
    fields: [
      { key: 'bedrooms', label: { en: 'Bedrooms', km: 'បន្ទប់គេង' }, type: 'number', filterable: false, onCard: true },
      { key: 'bathrooms', label: { en: 'Bathrooms', km: 'បន្ទប់ទឹក' }, type: 'number', onCard: true },
      { key: 'landSize', label: { en: 'Land size', km: 'ទំហំដី' }, type: 'number', unit: 'm²', onCard: true },
      { key: 'houseSize', label: { en: 'House size', km: 'ទំហំផ្ទះ' }, type: 'number', unit: 'm²' },
      { key: 'floors', label: { en: 'Floors', km: 'ចំនួនជាន់' }, type: 'number' },
      { key: 'title', label: { en: 'Title deed', km: 'ប្លង់' }, type: 'select', options: ['Hard title', 'Soft title', 'Strata title', 'Not applicable'], filterable: true },
      { key: 'furnishing', label: { en: 'Furnishing', km: 'គ្រឿងសង្ហារឹម' }, type: 'select', options: ['Fully furnished', 'Partly furnished', 'Unfurnished'], filterable: true },
    ],
  },
  {
    slug: 'jobs',
    name: { en: 'Jobs', km: 'ការងារ' },
    icon: 'briefcase',
    color: '#2b8a3e',
    hasCondition: false,
    hasDealType: false,
    defaultPriceUnit: 'month',
    priceLabel: { en: 'Salary', km: 'ប្រាក់ខែ' },
    subcategories: [
      { slug: 'sales-marketing', name: { en: 'Sales & Marketing', km: 'ផ្នែកលក់ និងទីផ្សារ' } },
      { slug: 'accounting-finance', name: { en: 'Accounting & Finance', km: 'គណនេយ្យ និងហិរញ្ញវត្ថុ' } },
      { slug: 'it-software', name: { en: 'IT & Software', km: 'IT និង Software' } },
      { slug: 'admin-hr', name: { en: 'Admin & HR', km: 'រដ្ឋបាល និង HR' } },
      { slug: 'hospitality', name: { en: 'Hotel & Restaurant', km: 'សណ្ឋាគារ និងភោជនីយដ្ឋាន' } },
      { slug: 'driver-delivery', name: { en: 'Driver & Delivery', km: 'អ្នកបើកបរ និងដឹកជញ្ជូន' } },
      { slug: 'technician', name: { en: 'Technician & Construction', km: 'ជាងបច្ចេកទេស និងសំណង់' } },
      { slug: 'teaching', name: { en: 'Teaching & Education', km: 'បង្រៀន និងអប់រំ' } },
    ],
    fields: [
      { key: 'position', label: { en: 'Position', km: 'មុខតំណែង' }, type: 'text', required: true },
      { key: 'company', label: { en: 'Company', km: 'ក្រុមហ៊ុន' }, type: 'text', onCard: true },
      { key: 'employmentType', label: { en: 'Employment type', km: 'ប្រភេទការងារ' }, type: 'select', options: ['Full-time', 'Part-time', 'Contract', 'Internship'], filterable: true, onCard: true },
      { key: 'experience', label: { en: 'Experience', km: 'បទពិសោធន៍' }, type: 'select', options: ['No experience', '1 year', '2 years', '3+ years', '5+ years'], filterable: true },
      { key: 'education', label: { en: 'Education', km: 'កម្រិតវប្បធម៌' }, type: 'select', options: ['Any', 'High school', 'Associate degree', "Bachelor's degree", "Master's degree"] },
      { key: 'hiring', label: { en: 'Hiring', km: 'ចំនួនជ្រើសរើស' }, type: 'number' },
      { key: 'deadline', label: { en: 'Closing date', km: 'ថ្ងៃផុតកំណត់' }, type: 'text' },
    ],
  },
  {
    slug: 'services',
    name: { en: 'Services', km: 'សេវាកម្ម' },
    icon: 'wrench',
    color: '#e67700',
    hasCondition: false,
    hasDealType: false,
    subcategories: [
      { slug: 'repair', name: { en: 'Repair & Maintenance', km: 'ជួសជុល និងថែទាំ' } },
      { slug: 'cleaning', name: { en: 'Cleaning', km: 'សម្អាត' } },
      { slug: 'moving', name: { en: 'Moving & Transport', km: 'ដឹកជញ្ជូន និងផ្លាស់ទីលំនៅ' } },
      { slug: 'tutoring', name: { en: 'Tutoring & Classes', km: 'បង្រៀន និងវគ្គសិក្សា' } },
      { slug: 'events', name: { en: 'Events & Photography', km: 'ព្រឹត្តិការណ៍ និងថតរូប' } },
      { slug: 'construction', name: { en: 'Construction & Renovation', km: 'សំណង់ និងកែលម្អ' } },
    ],
    fields: [
      { key: 'serviceArea', label: { en: 'Service area', km: 'តំបន់សេវា' }, type: 'text', onCard: true },
      { key: 'availability', label: { en: 'Availability', km: 'ម៉ោងធ្វើការ' }, type: 'text' },
      { key: 'experience', label: { en: 'Experience', km: 'បទពិសោធន៍' }, type: 'text' },
    ],
  },
  {
    slug: 'fashion-beauty',
    name: { en: 'Fashion & Beauty', km: 'ម៉ូដ និងសម្រស់' },
    icon: 'shirt',
    color: '#ae3ec9',
    hasCondition: true,
    hasDealType: false,
    subcategories: [
      { slug: 'mens-clothing', name: { en: "Men's Clothing", km: 'សម្លៀកបំពាក់បុរស' } },
      { slug: 'womens-clothing', name: { en: "Women's Clothing", km: 'សម្លៀកបំពាក់នារី' } },
      { slug: 'shoes', name: { en: 'Shoes', km: 'ស្បែកជើង' } },
      { slug: 'bags', name: { en: 'Bags', km: 'កាបូប' } },
      { slug: 'watches-jewelry', name: { en: 'Watches & Jewelry', km: 'នាឡិកា និងគ្រឿងអលង្ការ' } },
      { slug: 'beauty', name: { en: 'Cosmetics & Skincare', km: 'គ្រឿងសំអាង និងថែរក្សាស្បែក' } },
    ],
    fields: [
      { key: 'brand', label: { en: 'Brand', km: 'ម៉ាក' }, type: 'text', onCard: true },
      { key: 'size', label: { en: 'Size', km: 'ទំហំ' }, type: 'text', onCard: true },
      { key: 'gender', label: { en: 'For', km: 'សម្រាប់' }, type: 'select', options: ['Men', 'Women', 'Unisex', 'Kids'], filterable: true },
      color,
      { key: 'material', label: { en: 'Material', km: 'សម្ភារៈ' }, type: 'text' },
    ],
  },
  {
    slug: 'furniture-decor',
    name: { en: 'Furniture & Decor', km: 'គ្រឿងសង្ហារឹម និងលម្អ' },
    icon: 'sofa',
    color: '#8d6e3f',
    hasCondition: true,
    hasDealType: false,
    subcategories: [
      { slug: 'living-room', name: { en: 'Living Room', km: 'បន្ទប់ទទួលភ្ញៀវ' } },
      { slug: 'bedroom', name: { en: 'Bedroom', km: 'បន្ទប់គេង' } },
      { slug: 'office-furniture', name: { en: 'Office Furniture', km: 'គ្រឿងសង្ហារឹមការិយាល័យ' } },
      { slug: 'kitchen-dining', name: { en: 'Kitchen & Dining', km: 'ផ្ទះបាយ និងតុអាហារ' } },
      { slug: 'decor', name: { en: 'Home Decor', km: 'គ្រឿងលម្អផ្ទះ' } },
      { slug: 'garden', name: { en: 'Garden & Outdoor', km: 'សួនច្បារ និងខាងក្រៅ' } },
    ],
    fields: [
      { key: 'material', label: { en: 'Material', km: 'សម្ភារៈ' }, type: 'text', onCard: true },
      { key: 'dimensions', label: { en: 'Dimensions', km: 'ទំហំ' }, type: 'text', onCard: true },
      color,
    ],
  },
  {
    slug: 'books-sports-hobbies',
    name: { en: 'Books, Sports & Hobbies', km: 'សៀវភៅ កីឡា និងកម្សាន្ត' },
    icon: 'book',
    color: '#1098ad',
    hasCondition: true,
    hasDealType: false,
    subcategories: [
      { slug: 'books', name: { en: 'Books', km: 'សៀវភៅ' } },
      { slug: 'sports-equipment', name: { en: 'Sports & Fitness', km: 'សម្ភារៈកីឡា' } },
      { slug: 'musical-instruments', name: { en: 'Musical Instruments', km: 'ឧបករណ៍តន្ត្រី' } },
      { slug: 'toys-games', name: { en: 'Toys & Games', km: 'ប្រដាប់ក្មេងលេង និងហ្គេម' } },
      { slug: 'collectibles', name: { en: 'Collectibles & Art', km: 'វត្ថុប្រមូល និងសិល្បៈ' } },
    ],
    fields: [
      { key: 'brand', label: { en: 'Brand / Author', km: 'ម៉ាក / អ្នកនិពន្ធ' }, type: 'text', onCard: true },
      { key: 'type', label: { en: 'Type', km: 'ប្រភេទ' }, type: 'text' },
      { key: 'language', label: { en: 'Language', km: 'ភាសា' }, type: 'select', options: ['Khmer', 'English', 'Khmer & English', 'Other', 'Not applicable'] },
    ],
  },
  {
    slug: 'pets',
    name: { en: 'Pets', km: 'សត្វចិញ្ចឹម' },
    icon: 'paw',
    color: '#f08c00',
    hasCondition: false,
    hasDealType: false,
    subcategories: [
      { slug: 'dogs', name: { en: 'Dogs', km: 'ឆ្កែ' } },
      { slug: 'cats', name: { en: 'Cats', km: 'ឆ្មា' } },
      { slug: 'birds', name: { en: 'Birds', km: 'បក្សី' } },
      { slug: 'fish', name: { en: 'Fish & Aquariums', km: 'ត្រី និងអាងចិញ្ចឹមត្រី' } },
      { slug: 'pet-supplies', name: { en: 'Pet Food & Supplies', km: 'ចំណី និងសម្ភារៈសត្វ' } },
    ],
    fields: [
      { key: 'breed', label: { en: 'Breed', km: 'ពូជ' }, type: 'text', onCard: true },
      { key: 'age', label: { en: 'Age', km: 'អាយុ' }, type: 'text', onCard: true },
      { key: 'sex', label: { en: 'Sex', km: 'ភេទ' }, type: 'select', options: ['Male', 'Female', 'Pair', 'Not applicable'] },
      { key: 'vaccinated', label: { en: 'Vaccinated', km: 'ចាក់វ៉ាក់សាំង' }, type: 'select', options: ['Yes', 'No', 'Not applicable'], filterable: true },
    ],
  },
  {
    slug: 'food',
    name: { en: 'Food', km: 'អាហារ' },
    icon: 'food',
    color: '#e03131',
    hasCondition: false,
    hasDealType: false,
    subcategories: [
      { slug: 'fresh-produce', name: { en: 'Fresh Produce', km: 'ផលិតផលស្រស់' } },
      { slug: 'local-specialties', name: { en: 'Local Specialties', km: 'ផលិតផលក្នុងស្រុក' } },
      { slug: 'snacks-drinks', name: { en: 'Snacks & Drinks', km: 'អាហារសម្រន់ និងភេសជ្ជៈ' } },
      { slug: 'catering', name: { en: 'Catering & Meals', km: 'ម្ហូបអាហារកម្មង់' } },
    ],
    fields: [
      { key: 'weight', label: { en: 'Weight / Pack size', km: 'ទម្ងន់ / កញ្ចប់' }, type: 'text', onCard: true },
      { key: 'origin', label: { en: 'Origin', km: 'ប្រភព' }, type: 'text', onCard: true },
      { key: 'shelfLife', label: { en: 'Shelf life', km: 'រយៈពេលប្រើប្រាស់' }, type: 'text' },
    ],
  },
];

export const categoryBySlug = (slug: string) => CATEGORIES.find((c) => c.slug === slug);

export const subcategoryBySlug = (catSlug: string, subSlug: string) =>
  categoryBySlug(catSlug)?.subcategories.find((s) => s.slug === subSlug);

/** All spec fields for a category + subcategory, in display order. */
export function fieldsFor(catSlug: string, subSlug?: string): SpecField[] {
  const cat = categoryBySlug(catSlug);
  if (!cat) return [];
  const sub = subSlug ? cat.subcategories.find((s) => s.slug === subSlug) : undefined;
  return [...cat.fields, ...(sub?.fields ?? [])];
}
