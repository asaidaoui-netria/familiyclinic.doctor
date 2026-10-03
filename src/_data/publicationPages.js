import publicationData from './publications.js';
import {buildLibrary} from '../lib/publication-library.js';
export default () => buildLibrary(publicationData()).pages;
