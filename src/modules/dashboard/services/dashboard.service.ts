import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '@/modules/autodealer/entities/store.entity';
import { Product } from '@/modules/autodealer/entities/product.entity';
import { DASHBOARD_CATEGORIES } from '@/constants';
import { SearchDto } from '../dto/search.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DashboardService {
  private statesDir = path.join(__dirname, '../../../../data/nigeriastates');
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

    async search(filters: SearchDto) {
      const { q, price_min, price_max, year_min, year_max, make, colour, fuel, listing_type, category, type } = filters;

      let stores: Store[] = [];
      let products: Product[] = [];

      // --- SEARCH PRODUCTS ---
      if (!type || type === 'product' || type === 'all') {
        const productQuery = this.productRepository.createQueryBuilder('product')
          .leftJoinAndSelect('product.store', 'store');

        if (q) {
          productQuery.andWhere(
            `(product.title ILIKE :q OR product.description ILIKE :q OR product.category ILIKE :q 
              OR product.location_coordinates ILIKE :q OR product.listing_type ILIKE :q 
              OR product.make ILIKE :q OR product.year::text ILIKE :q 
              OR product.type ILIKE :q OR product.condition ILIKE :q 
              OR product.mileage::text ILIKE :q OR product.colour ILIKE :q 
              OR product.body ILIKE :q OR product.fuel ILIKE :q 
              OR store.name ILIKE :q OR store.description ILIKE :q)`,
            { q: `%${q}%` }
          );
        }

        if (category) productQuery.andWhere('product.category IN (:...categories)', { categories: category.split(',') });
        if (listing_type) productQuery.andWhere('product.listing_type IN (:...listing_types)', { listing_types: listing_type.split(',') });
        if (make?.length) productQuery.andWhere('product.make IN (:...makes)', { makes: make });
        if (colour?.length) productQuery.andWhere('product.colour IN (:...colours)', { colours: colour });
        if (fuel?.length) productQuery.andWhere('product.fuel IN (:...fuels)', { fuels: fuel });

        if (price_min) productQuery.andWhere('product.price::numeric >= :price_min', { price_min });
        if (price_max) productQuery.andWhere('product.price::numeric <= :price_max', { price_max });
        if (year_min) productQuery.andWhere('product.year::numeric >= :year_min', { year_min });
        if (year_max) productQuery.andWhere('product.year::numeric <= :year_max', { year_max });

        products = await productQuery.orderBy('product.created_at', 'DESC').getMany();
      }

      // --- SEARCH STORES ---
      if (!type || type === 'store' || type === 'all') {
        const storeQuery = this.storeRepository.createQueryBuilder('store')
          .leftJoinAndSelect('store.products', 'product');

        if (q) {
          storeQuery.andWhere(
            `(store.name ILIKE :q OR store.description ILIKE :q OR store.category ILIKE :q
              OR store.address ILIKE :q OR store.registration_no ILIKE :q 
              OR store.phone ILIKE :q OR store.email ILIKE :q OR store.website ILIKE :q
              OR store.contact_person_name ILIKE :q OR store.contact_person_phone ILIKE :q 
              OR store.location_coordinates ILIKE :q OR store.subscription_plan ILIKE :q
              OR product.title ILIKE :q OR product.description ILIKE :q)`,
            { q: `%${q}%` }
          );
        }

        if (category) storeQuery.andWhere('store.category IN (:...categories)', { categories: category.split(',') });

        // Optional: Filter stores by product ranges
        if (price_min) storeQuery.andWhere('product.price::numeric >= :price_min', { price_min });
        if (price_max) storeQuery.andWhere('product.price::numeric <= :price_max', { price_max });
        if (year_min) storeQuery.andWhere('product.year::numeric >= :year_min', { year_min });
        if (year_max) storeQuery.andWhere('product.year::numeric <= :year_max', { year_max });

        stores = await storeQuery.orderBy('store.created_at', 'DESC').getMany();
      }

      return { products, stores };
    }

    async getCategory(categoryId: number) {
      const category = DASHBOARD_CATEGORIES.find(c => c.id === +categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }

      let stores: Store[] = [];
      let products: Product[] = [];

      if (category.name.includes('Swap')) {
        products = await this.productRepository.find({
          where: [
            { listing_type: 'Swap' },
            { listing_type: 'Both' },
          ],
        });
      } else {
        [products, stores] = await Promise.all([
          this.productRepository.find({ where: { category: category.name } }),
          this.storeRepository.find({ where: { category: category.name } }),
        ]);
      }

      return {
        category: category.name,
        products,
        stores,
      };
    }

    async getAllStores() {
      return await this.storeRepository.find({
        order: { created_at: 'DESC' },
      });
    }

    async getStoreById(id: number) {
      const store = await this.storeRepository.findOne({ where: { id } });
      if (!store) throw new NotFoundException('Store not found');

      return store;
    }

    async getAllProducts() {
      return await this.productRepository.find({
        order: { created_at: 'DESC' },
      });
    }

    async getProductById(id: number) {
      const product = await this.productRepository.findOne({ where: { id } });
      if (!product) throw new NotFoundException('Product not found');

      return product;
    }

    getAllStates() {
      const files = fs.readdirSync(this.statesDir);
      return files.map((file, index) => {
        const name = path.basename(file, '.json'); // strip .json
        return { id: index + 1, name: this.capitalize(name) };
      });
    }

    getCitiesByStateId(stateId: number) {
      const states = this.getAllStates();
      const state = states.find(s => s.id === +stateId);
      if (!state) {
        throw new NotFoundException('State not found');
      }

      const filePath = path.join(this.statesDir, state.name.toLowerCase() + '.json');
      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('State data file not found');
      }

      const cities = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return cities;
    }

    private capitalize(str: string) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
