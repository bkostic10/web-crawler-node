
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Fetches HTML content from a given URL.
 * @param url The URL to fetch.
 */
async function fetchHTML(url: string): Promise<string> {
    try {
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`Error fetching URL (${url}):`, error);
        throw error;
    }
}

interface Inventory{
    href: string;
    price: string;
    livingSpace: string[];
    address: string;
    descriptionTitle: string;
    description: string;
    imageUrl?: string;
}

/**
 * Parses and extracts all <a> tag hrefs from the HTML.
 * @param html The HTML content to parse.
 */
function extractInventory(html: string): Inventory[] {
    const $ = cheerio.load(html);
    const inventoryList: Inventory[] = [];
    $('[role="listitem"]').each((_, element) => {
        const href = $(element).find('a').first().attr('href');
        const price = $(element).find('span[class^="HgListingCard_price"]').text().trim();
        const livingSpace:string[] = [];
        $(element).find('div[class^="HgListingRoomsLivingSpace_"] > span').each((_, element) => {
            livingSpace.push($(element).text().trim());
        });
        const address = $(element).find('address').text().trim();
        const descriptionTitle = $(element).find('span[class^="HgListingDescription_title"]').text().trim();
        const description = $(element).find('span[class^="HgListingDescription_medium"]').text().trim();
        const imagesUrl = $(element).find('picture > source').attr("srcset");
        const imageUrl = imagesUrl?.split(',')[0].split(' ')[0];
        if (href) inventoryList.push({href, price, livingSpace, address,descriptionTitle,description, imageUrl});
    });
    /*$('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href) links.push(href);
    });*/
    return inventoryList;
}

/**
 * Crawls a given URL and logs extracted links.
 * @param url The starting URL.
 */
async function crawl(url: string): Promise<void> {
    console.log(`Crawling URL: ${url}`);

    try {        
        const html = await fetchHTML(url);
        const inventoryList = extractInventory(html);

        console.log(`Found ${inventoryList.length} items:`);
        inventoryList.forEach((inventory, index) => console.log(`${index + 1}: ${inventory.href.replace('/rent/', '')}`));
        console.log(JSON.stringify(inventoryList));
    } catch (error) {
        console.error('Crawl failed:', error);
    }
}

// Entry point
const targetURL = process.argv[2];
if (!targetURL) {
    console.error('Please provide a URL as a command-line argument.');
    process.exit(1);
}

crawl(targetURL);

// example
// npm start -- https://www.homegate.ch/rent/real-estate/city-zurich/matching-list?ac=2.5"&"ah=1600
// npm run dev -- https://www.homegate.ch/rent/real-estate/city-zurich/matching-list?ac=2.5"&"ah=1600