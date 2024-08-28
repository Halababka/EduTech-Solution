import {
  faFileAlt,
  faFileArchive, faFileAudio,
  faFileExcel, faFileImage,
  faFilePdf,
  faFilePowerpoint, faFileVideo,
  faFileWord,
  faLink, faFolder
} from "@fortawesome/free-solid-svg-icons";
import {faYoutube} from "@fortawesome/free-brands-svg-icons";

const fileIcons = {
  pdf: faFilePdf,
  doc: faFileWord,
  docx: faFileWord,
  xls: faFileExcel,
  xlsx: faFileExcel,
  ppt: faFilePowerpoint,
  pptx: faFilePowerpoint,
  zip: faFileArchive,
  rar: faFileArchive,
  jpg: faFileImage,
  jpeg: faFileImage,
  png: faFileImage,
  gif: faFileImage,
  mp3: faFileAudio,
  wav: faFileAudio,
  mp4: faFileVideo,
  mov: faFileVideo,
  avi: faFileVideo,
  txt: faFileAlt,
  url: faLink,
  folder: faFolder,
  video: faYoutube, // Пример иконки для неизвестных файлов
  // Добавьте другие расширения и соответствующие им иконки по мере необходимости
};
export function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts[parts.length - 1];
}

export function videoId(videoUrl) {
  try {
    const params = new URLSearchParams(new URL(videoUrl).search);
    return params.get("v") ?? "";
  } catch (error) {
    console.error(`Ошибка извлечения данных из ссылки ${error}`);
    return "";
  }
}

export const getDomainFromUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    return '';
  }
};

export const getFileIcon = (filename) => {
  const extension = filename.split(".").pop().toLowerCase();
  return fileIcons[extension] || faFileAlt; // Возвращает иконку по расширению файла, либо иконку по умолчанию
};