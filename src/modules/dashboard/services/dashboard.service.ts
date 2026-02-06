import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '@/modules/autodealer/entities/store.entity';
import { Product } from '@/modules/autodealer/entities/product.entity';
import { ProductAttribute } from '@/modules/superadmin/entities/product-attribute.entity';
import { DASHBOARD_CATEGORIES } from '@/constants';
import { SearchDto } from '../dto/search.dto';
import * as fs from 'fs';
import * as path from 'path';
import { PaginationDto } from '@/modules/global/common/dto/pagination.dto';

@Injectable()
export class DashboardService {
  private statesDir = path.join(__dirname, '../../../../data/nigeriastates');
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductAttribute)
    private readonly productAttributeRepository: Repository<ProductAttribute>,
  ) {}

    async search(filters: SearchDto, pagination: PaginationDto) {
      const { q, price_min, price_max, year_min, year_max, make, colour, fuel, listing_type, category, type } = filters;

      const { page = 1, limit = 100 } = pagination;
      const skip = (page - 1) * limit;

      let stores: Store[] = [];
      let products: Product[] = [];
      let totalStores = 0;
      let totalProducts = 0;

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

        [ products, totalProducts ] = await productQuery.orderBy('product.created_at', 'DESC').skip(skip).take(limit).getManyAndCount();
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

        [ stores, totalStores ] = await storeQuery.orderBy('store.created_at', 'DESC').skip(skip).take(limit).getManyAndCount();
      }

        return {
          meta: {
            page,
            limit,
            totalProducts,
            totalStores,
            total: totalProducts + totalStores,
            totalPages: Math.ceil((totalProducts + totalStores) / limit),
          },
          products,
          stores,
        };
    }

    async getCategory(categoryId: number, pagination: PaginationDto) {
      const category = DASHBOARD_CATEGORIES.find(c => c.id === +categoryId);
      if (!category) throw new NotFoundException('Category not found');

      const { page = 1, limit = 100 } = pagination;
      const skip = (page - 1) * limit;

      let products: Product[] = [];
      let stores: Store[] = [];
      let totalProducts = 0;
      let totalStores = 0;

      if (category.name.includes('Swap')) {
        const [swapProducts, count] = await this.productRepository
          .createQueryBuilder('product')
          .where('product.listing_type IN (:...types)', { types: ['Swap', 'Both'] })
          .skip(skip)
          .take(limit)
          .getManyAndCount();

        products = swapProducts;
        totalProducts = count;
      } 
      else {
        const [categoryProducts, productCount] = await this.productRepository
          .createQueryBuilder('product')
          .where('product.category = :category', { category: category.name })
          .skip(skip)
          .take(limit)
          .getManyAndCount();

        const [categoryStores, storeCount] = await this.storeRepository
          .createQueryBuilder('store')
          .where('store.category = :category', { category: category.name })
          .skip(skip)
          .take(limit)
          .getManyAndCount();

        products = categoryProducts;
        stores = categoryStores;
        totalProducts = productCount;
        totalStores = storeCount;
      }

      return {
        meta: {
          page,
          limit,
          totalProducts,
          totalStores,
          total: totalProducts + totalStores,
          totalPages: Math.ceil((totalProducts + totalStores) / limit),
        },
        category: category.name,
        products,
        stores,
      };
    }

    async getAllStores(pagination: PaginationDto) {
      const { page = 1, limit = 100 } = pagination;
      const skip = (page - 1) * limit;

      const [stores, total] = await this.storeRepository
        .createQueryBuilder('store')
        .orderBy('store.created_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stores,
      };
    }

    async getStoreById(id: number) {
      const store = await this.storeRepository.findOne({ where: { id } });
      if (!store) throw new NotFoundException('Store not found');

      const products = await this.productRepository.find({
        where: { store: { id } },
        order: { created_at: 'DESC' },
        take: 10,
      });


      return {
        ...store,
        products,
      };
    }

    async getAllProducts(pagination: PaginationDto) {
      const { page = 1, limit = 10 } = pagination;
      const skip = (page - 1) * limit;

      const [products, total] = await this.productRepository
        .createQueryBuilder('product')
        .orderBy('product.created_at', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        products,
      };
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

    private capitalize(str: string) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getCitiesByStateId(stateId: number, pagination: PaginationDto) {
      const states = this.getAllStates();
      const state = states.find(s => s.id === +stateId);

      const { page = 1, limit = 100 } = pagination;
      const start = (page - 1) * limit;
      const end = start + limit;
      
      if (!state) {
        throw new NotFoundException('State not found');
      }

      const filePath = path.join(this.statesDir, state.name.toLowerCase() + '.json');

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('State data file not found');
      }

      const cities = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      const sortedCities = cities.sort((a, b) => {
        const popA = a['pop est'] || 0;
        const popB = b['pop est'] || 0;
        return popB - popA;
      });

      const paginatedCities = sortedCities.slice(start, end);

      return {
        meta: {
          page,
          limit,
          total: cities.length,
          totalPages: Math.ceil(cities.length / limit),
        },
        paginatedCities,
      };
    }

    async getAllProductAttributes() {
      return await this.productAttributeRepository.find({ order: { attribute_type: 'ASC', value: 'ASC' } });
    }

    async getProductAttributesByType(attribute_type: string) {
      return await this.productAttributeRepository.find({
        where: { attribute_type: attribute_type as any },
        order: { value: 'ASC' },
      });
    }
}

