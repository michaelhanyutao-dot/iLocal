import { Event, EventCategory } from '@/types/event';
import musicImage from '@/assets/music-event.jpg';
import marketImage from '@/assets/market-event.jpg';
import exhibitionImage from '@/assets/exhibition-event.jpg';
import partyImage from '@/assets/party-event.jpg';
import barImage from '@/assets/bar-event.jpg';

export const mockEvents: Event[] = [
  {
    id: '1',
    title: '独立音乐现场 - 春日限定',
    description: '本地独立乐队专场演出，感受原创音乐的力量',
    category: 'music' as EventCategory,
    date: '2026-07-22',
    dateLabel: 'Jul 22',
    time: '20:00',
    location: {
      address: '北京市朝阳区工体北路8号三里屯SOHO',
      lat: 39.9353,
      lng: 116.4604,
      district: '朝阳区'
    },
    ticket: {
      isFree: false,
      price: 120,
      ticketUrl: '#'
    },
    coverImage: musicImage,
    organizer: '麻雀瓦舍',
    tags: ['独立音乐', '现场演出', '三里屯'],
    attendees: 85
  },
  {
    id: '2',
    title: '周末创意市集',
    description: '手工艺品、原创设计、美食小吃一应俱全',
    category: 'market' as EventCategory,
    date: '2026-07-25',
    dateLabel: 'Jul 25',
    time: '10:00',
    location: {
      address: '北京市海淀区中关村大街1号中关村广场',
      lat: 39.9792,
      lng: 116.3092,
      district: '海淀区'
    },
    ticket: {
      isFree: true
    },
    coverImage: marketImage,
    organizer: '创意生活',
    tags: ['手工艺', '原创设计', '周末市集'],
    attendees: 156
  },
  {
    id: '3',
    title: '798夜间艺术展',
    description: '当代艺术展，夜间延时开放。',
    category: 'exhibition' as EventCategory,
    date: '2026-07-23',
    dateLabel: 'Jul 23',
    time: '20:00',
    location: {
      address: '北京市朝阳区酒仙桥路4号798艺术区',
      lat: 39.9845,
      lng: 116.4950,
      district: '朝阳区'  
    },
    ticket: {
      isFree: false,
      price: 50,
      ticketUrl: '#'
    },
    coverImage: exhibitionImage,
    organizer: '798艺术中心',
    tags: ['当代艺术', '科技艺术', '798'],
    attendees: 203
  },
  {
    id: '4',
    title: '户外音乐派对',
    description: '在星空下享受电子音乐的狂欢',
    category: 'party' as EventCategory,
    date: '2026-07-24',
    dateLabel: 'Jul 24',
    time: '19:00',
    location: {
      address: '北京市顺义区温榆河公园',
      lat: 40.1011,
      lng: 116.6543,
      district: '顺义区'
    },
    ticket: {
      isFree: false,
      price: 200,
      ticketUrl: '#'
    },
    coverImage: partyImage,
    organizer: '夜猫子',
    tags: ['电子音乐', '户外派对', '星空'],
    attendees: 324
  },
  {
    id: '5',
    title: '酒吧驻唱夜',
    description: '本地歌手深情演唱，与美酒为伴',
    category: 'bar' as EventCategory,
    date: '2026-07-21',
    dateLabel: 'Jul 21',
    time: '21:30',
    location: {
      address: '北京市东城区南锣鼓巷108号',
      lat: 39.9403,
      lng: 116.4057,
      district: '东城区'
    },
    ticket: {
      isFree: true
    },
    coverImage: barImage,
    organizer: '老北京酒吧',
    tags: ['驻唱', '酒吧', '南锣鼓巷'],
    attendees: 67
  },
  {
    id: '6',
    title: '周末篮球友谊赛',
    description: '业余篮球爱好者聚集，享受运动快乐',
    category: 'sports' as EventCategory,
    date: '2026-07-26',
    dateLabel: 'Jul 26',
    time: '14:00',
    location: {
      address: '北京市海淀区奥林匹克公园篮球场',
      lat: 39.9928,
      lng: 116.3917,
      district: '海淀区'
    },
    ticket: {
      isFree: true
    },
    coverImage: marketImage, // Reusing market image for now
    organizer: '篮球联盟',
    tags: ['篮球', '运动', '友谊赛'],
    attendees: 24
  }
];
