'use client';

import {
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  Circle,
  Check,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  ClipboardPlus,
  FilePlus,
  PlusCircle,
  Plus,
  FileSearch,
  Search,
  ShieldCheck,
  ShieldAlert,
  Shield,
  HeartPulse,
  Clock,
  Folder,
  FolderOpen,
  FolderArchive,
  LayoutDashboard,
  Sparkles,
  Bot,
  GraduationCap,
  Settings,
  HelpCircle,
  PanelRightClose,
  SlidersHorizontal,
  Moon,
  Sun,
  Bell,
  MoreVertical,
  MoreHorizontal,
  X,
  CircleX,
  Play,
  Download,
  UploadCloud,
  Upload,
  BookOpen,
  FileText,
  Receipt,
  AlertTriangle,
  Info,
  Eye,
  Calendar,
  FileEdit,
  Pencil,
  Trash2,
  Paperclip,
  Pill,
  Stethoscope,
  FlaskConical,
  User,
  BadgeAlert,
  Copy,
} from 'lucide-react';

import { createAnimatedIcon, AnimateIcon, type AnimatedLucideProps, type AnimationType } from './icon-wrapper';

export { AnimateIcon };
export type { AnimatedLucideProps, AnimationType };

// Navigation & Directional Icons
export const IconArrowRight = createAnimatedIcon(ArrowRight, 'slide-right');
export const IconArrowLeft = createAnimatedIcon(ArrowLeft, 'slide-left');
export const IconArrowUp = createAnimatedIcon(ArrowUp, 'slide-up');
export const IconArrowUpRight = createAnimatedIcon(ArrowUpRight, 'slide-right');
export const IconExternalLink = createAnimatedIcon(ExternalLink, 'slide-right');

// Status & Verification Icons
export const IconCheckCircle = createAnimatedIcon(CheckCircle2, 'pop');
export const IconCircle = createAnimatedIcon(Circle, 'default');
export const IconCheck = createAnimatedIcon(Check, 'pop');
export const IconCheckSquare = createAnimatedIcon(CheckSquare, 'pop');
export const IconShieldCheck = createAnimatedIcon(ShieldCheck, 'pop');
export const IconShieldAlert = createAnimatedIcon(ShieldAlert, 'pulse');
export const IconShield = createAnimatedIcon(Shield, 'default');
export const IconAlertTriangle = createAnimatedIcon(AlertTriangle, 'pulse');
export const IconInfo = createAnimatedIcon(Info, 'default');
export const IconBadgeAlert = createAnimatedIcon(BadgeAlert, 'pulse');

// Action & Document Icons
export const IconClipboardCheck = createAnimatedIcon(ClipboardCheck, 'pop');
export const IconClipboardList = createAnimatedIcon(ClipboardList, 'default');
export const IconClipboardPlus = createAnimatedIcon(ClipboardPlus, 'pulse');
export const IconFilePlus = createAnimatedIcon(FilePlus, 'pulse');
export const IconPlusCircle = createAnimatedIcon(PlusCircle, 'pulse');
export const IconPlus = createAnimatedIcon(Plus, 'pulse');
export const IconFileSearch = createAnimatedIcon(FileSearch, 'pulse');
export const IconSearch = createAnimatedIcon(Search, 'pulse');
export const IconFolder = createAnimatedIcon(Folder, 'default');
export const IconFolderOpen = createAnimatedIcon(FolderOpen, 'pulse');
export const IconFolderArchive = createAnimatedIcon(FolderArchive, 'default');
export const IconBookOpen = createAnimatedIcon(BookOpen, 'default');
export const IconFileText = createAnimatedIcon(FileText, 'default');
export const IconReceipt = createAnimatedIcon(Receipt, 'default');
export const IconFileEdit = createAnimatedIcon(FileEdit, 'pulse');
export const IconPencil = createAnimatedIcon(Pencil, 'pulse');
export const IconTrash2 = createAnimatedIcon(Trash2, 'pop');
export const IconPaperclip = createAnimatedIcon(Paperclip, 'default');
export const IconEye = createAnimatedIcon(Eye, 'pulse');
export const IconCopy = createAnimatedIcon(Copy, 'pop');
export const IconDownload = createAnimatedIcon(Download, 'slide-down');
export const IconUploadCloud = createAnimatedIcon(UploadCloud, 'slide-up');
export const IconUpload = createAnimatedIcon(Upload, 'slide-up');

// Healthcare & Domain Icons
export const IconHeartPulse = createAnimatedIcon(HeartPulse, 'pulse');
export const IconClock = createAnimatedIcon(Clock, 'default');
export const IconCalendar = createAnimatedIcon(Calendar, 'default');
export const IconPill = createAnimatedIcon(Pill, 'default');
export const IconStethoscope = createAnimatedIcon(Stethoscope, 'default');
export const IconFlaskConical = createAnimatedIcon(FlaskConical, 'default');
export const IconUser = createAnimatedIcon(User, 'default');

// AI & Shell UI Icons
export const IconSparkles = createAnimatedIcon(Sparkles, 'sparkle');
export const IconBot = createAnimatedIcon(Bot, 'pulse');
export const IconLayoutDashboard = createAnimatedIcon(LayoutDashboard, 'default');
export const IconGraduationCap = createAnimatedIcon(GraduationCap, 'default');
export const IconSettings = createAnimatedIcon(Settings, 'rotate-subtle');
export const IconHelpCircle = createAnimatedIcon(HelpCircle, 'pulse');
export const IconPanelRightClose = createAnimatedIcon(PanelRightClose, 'default');
export const IconSlidersHorizontal = createAnimatedIcon(SlidersHorizontal, 'default');
export const IconMoon = createAnimatedIcon(Moon, 'rotate-subtle');
export const IconSun = createAnimatedIcon(Sun, 'rotate-subtle');
export const IconBell = createAnimatedIcon(Bell, 'rotate-subtle');
export const IconMoreVertical = createAnimatedIcon(MoreVertical, 'default');
export const IconMoreHorizontal = createAnimatedIcon(MoreHorizontal, 'default');
export const IconX = createAnimatedIcon(X, 'default');
export const IconCircleX = createAnimatedIcon(CircleX, 'default');
export const IconPlay = createAnimatedIcon(Play, 'pulse');
