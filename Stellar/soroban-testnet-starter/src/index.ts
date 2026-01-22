// Add text-encoding as a dependency
import { TextDecoder, TextEncoder } from 'text-encoding';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
//Exports all handler functions
export * from "./mappings/mappingHandlers";
