declare module 'sdp-transform' {
	export interface SimulcastStream {
		scid: string | number;
		paused: boolean
	}

	export function write(session: object, opts?: any): string;

	export function parse(sdp: string): any;

	export function parseParams(str: string): any;

	export function parseFmtpConfig(str: string): any; // Alias of parseParams.

	export function parsePayloads(str: string): number[];

	export function parseImageAttributes(str: string): any[];

	export function parseSimulcastStreamList(str: string): SimulcastStream[];
}
