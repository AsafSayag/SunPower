export type FormField = {
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  maxMb?: number;
};

export const PRIVACY_PATH = "/%d7%9e%d7%93%d7%99%d7%a0%d7%99%d7%95%d7%aa-%d7%a4%d7%a8%d7%98%d7%99%d7%95%d7%aa1/";
export const MAX_UPLOAD_MB = 3;
export const UPLOAD_TYPES = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
