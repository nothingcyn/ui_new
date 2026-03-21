// 用户相关类型
export interface User {
  id: number
  phone: string
  nickname: string
  avatar?: string
  created_at: string
  updated_at: string
}

// User_info 与 User 类型相同，使用类型别名保持兼容


export interface ChangeMessageResponse {
  success: boolean
  message: string
}


export interface SendStreamMessageParams {
  conversationId: string;        // 后端期望的是 string 类型
  content: string;
  current_session_id: string | null; // 用户输入内容
  current_model_name: string;         // 当前选择的模型名字
  signal?: AbortSignal;               // 中止信号
  // ✅ 流式回调（核心）
  onMessage: (fullText: string) => void;
  onSessionId?: (sessionId: string) => void; 
  // ✅ 可选：更细粒度（推荐加）
  onChunk?: (chunk: string) => void;     // 每次新增内容
  onFinish?: () => void;                 // 完成
  onError?: (err: any) => void;          // 错误处理
}
// 聊天相关类型
export interface ChatSession {
  session_id: string; // 保存原始数字 ID 备用
  title: string;
  messages: Message[];
 
}
export interface ResetPasswordRequest {
  phone: string;
  sms_code: string;
  new_password: string;
  confirm_password: string;
}
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
// 认证相关类型
export interface LoginRequest {
 phone: string;
  password: string | null;
  sms_code: string | null;
  remember_me: boolean;
}

export interface RegisterRequest {
  phone: string
  password: string
  confirm_password: string
  sms_code: string
  nickname: string
  // 💣 提前排雷：注册时真实提交的数据也不需要图形验证码了（发短信时已经验证过）
  // 把它们变成可选，防止将来开发 Register.tsx 时报错
  captcha_id?: string
  captcha_text?: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

// 验证码相关类型
export interface CaptchaResponse {
  captcha_id: string
  image: string
}

// 🎯 发送短信的统一参数 (整合了新旧方式)
export interface SendSmsParams {
  phone: string;
  // 新方式：阿里云拼图验证 (设为可选，兼容后端旧接口)
  captcha_data?: {
    lot_number: string;
    captcha_output: string;
    pass_token: string;
    gen_time: string;
  };
  // 旧方式：图形验证码 (设为可选)
  captcha_id?: string;
  captcha_text?: string;
}



// 聊天相关类型
export interface Model {
  id: number
  name: string
  icon?: string // 加上这一行 (可选或必填看后端)
  description: string
  sub_models: SubModel[]
}

export interface SubModel {
  id: number
  name: string
  description: string
  parent_id: number
  icon?: string
}

export interface Conversation {
  id: number;
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[]

}

export interface Message {
  id: string
  systemName?: string
  role: 'user' | 'assistant'
  content: string
  current_model_name?: string;
  current_session_id?: string | null; 
  created_at: string
}

export interface SendMessageRequest {
  conversation_id: string
  current_model_name?: string;
  current_session_id: string | null;
  content: string
  onMessage: (fullText: string) => void;

  // ✅ 可选：更细粒度（推荐加）
  onChunk?: (chunk: string) => void;     // 每次新增内容
  onFinish?: () => void;                 // 完成
  onError?: (err: any) => void;          // 错误处理

}

// API响应类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 设备指纹类型
export interface FingerprintData {
  visitorId: string
  confidence: {
    score: number
    comment: string
  }
}
// User_info 与 User 类型相同，使用类型别名保持兼容
export type User_info = User