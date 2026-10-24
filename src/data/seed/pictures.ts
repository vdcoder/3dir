// C:\Users\Amanda\Pictures — the family photo library. Camera Roll keeps
// phone-style names; curated albums have descriptive names. Every image has
// an image preview (description usable as a text-to-image prompt + palette).

import type { SeedFolder } from '../seedTypes'
import { album, dir, f, photo } from './helpers'

// Phone numbering increases with time, so these carry explicit capture dates.
const roll: Array<[file: string, at: string, description: string, palette: string[]]> = [
  ['IMG_2041.jpg', '2026-09-20 14:12', 'A golden retriever napping in a patch of afternoon sun on a wide-plank oak floor, paws twitching mid-dream.', ['#d9a441', '#c08a52', '#f3e3c3', '#6b4a2f']],
  ['IMG_2042.jpg', '2026-09-26 10:05', 'A stack of rough-sawn walnut boards with white chalk marks leaning against a pegboard wall in a home workshop.', ['#5b3a24', '#efe6d6', '#8a6a4a', '#2e2a26']],
  ['IMG_2043.jpg', '2026-09-30 21:40', 'A laptop on a tidy home-office desk showing a colourful spreadsheet, next to a steaming mug and an open notebook.', ['#2f6f5e', '#f2efe9', '#c8553d', '#3a3a3a']],
  ['IMG_2044.HEIC', '2026-10-03 11:20', 'A farm pumpkin patch with rows of orange pumpkins on straw bales under a crisp blue October sky.', ['#e2711d', '#f4c06a', '#6f8f3a', '#9cc6e8']],
  ['IMG_2045.jpg', '2026-10-04 19:30', 'A bearded man tuning an acoustic guitar on a small pub stage under warm amber lights and a string of bulbs.', ['#b5651d', '#2a1c14', '#f2b85b', '#6e4b33']],
  ['IMG_2046.HEIC', '2026-10-09 17:02', 'Close-up of a grey-veined quartz countertop sample beside glossy green zellige tile samples on a plywood sheet.', ['#d9d6d0', '#8c8c88', '#3f7d5c', '#c8a97e']],
  ['IMG_2047.jpg', '2026-10-11 09:45', 'A maple tree in blazing scarlet foliage arching over a quiet suburban street still wet from rain.', ['#c0281f', '#e86a33', '#4b4b4b', '#a7b8c4']],
  ['IMG_2048.jpg', '2026-10-15 15:10', 'A whiteboard covered in a hand-drawn waterfall chart and colourful sticky notes in a bright meeting room.', ['#ffffff', '#2a62b8', '#f5d547', '#e05a47']],
  ['IMG_2049.jpg', '2026-10-16 19:25', 'A plate of miso-glazed salmon with sesame seeds, steamed rice and sliced cucumber on a dark stoneware plate.', ['#d9773a', '#f4efe4', '#2b2b2b', '#7fae5a']],
  ['IMG_2051.jpg', '2026-10-18 19:50', 'A small test pumpkin carved with an intricate geometric, architectural face pattern, glowing on a front step at dusk.', ['#f28c28', '#1b1b2f', '#ffd27a', '#5a3a22']],
  ['IMG_2052.jpg', '2026-10-21 08:10', 'A golden retriever in a pumpkin-print bandana sitting proudly by a front door hung with an autumn wreath.', ['#d9a441', '#c4532d', '#3a5a40', '#f2e3c6']],
  ['IMG_2053.jpg', '2026-10-23 18:30', 'A long workshop bench seen from above, scattered with hand planes, a marking gauge and curls of walnut shavings.', ['#5b3a24', '#d8b98a', '#8c8c8c', '#f0e4cc']],
]

const cameraRoll = dir('Camera Roll', [
  ...roll.map(([name, at, description, palette]) => photo(name, description, palette, { at })),
  f('IMG_2050.MOV', { at: '2026-10-17 15:31', size: 148_204_331 }),
], '2022-09-03 10:41')

// Windows names screenshots by capture time; the dates follow the names.
const shot = (stamp: string, description: string, palette: string[]) => {
  const [day, time] = stamp.split(' ')
  return photo(`Screenshot ${stamp}.png`, description, palette, { at: `${day} ${time.slice(0, 2)}:${time.slice(2, 4)}` })
}

const screenshots = dir('Screenshots', [
  shot('2026-08-14 101522', 'A screenshot of a garden-planning web app showing a grid of raised beds with colourful plant icons and one bed outlined in red.', ['#f4f1e8', '#7a9e7e', '#c4473a', '#2f3e34']),
  shot('2026-09-03 083011', 'A screenshot of a weather app showing a week of rain icons and falling temperatures over a grey gradient.', ['#5f6b7a', '#c9d3de', '#ffffff', '#2d6fd1']),
  shot('2026-09-29 162245', 'A screenshot of a bar chart comparing three retail sites by rent, footfall and fit-out cost in muted blues.', ['#ffffff', '#2a5d8f', '#8fb3d9', '#e0a03a']),
  shot('2026-10-12 140733', 'A screenshot of a tile shop web page comparing green zellige and plain white ceramic backsplash tiles side by side.', ['#ffffff', '#3f7d5c', '#e9e5dc', '#1e1e1e']),
  shot('2026-10-22 094512', "A screenshot of a presentation slide titled 'FY2027 budget framework' with a green waterfall chart rising from $21.8M to $24.1M.", ['#ffffff', '#1f4e3d', '#4caf7a', '#c8553d']),
], '2022-09-03 10:41')

const lisbon = dir('2025 Lisbon', album('2025-07-12 10:00', '2025-07-19 18:00', [
  ['Tram 28 on the hill.jpg', 'A bright yellow vintage tram climbing a steep cobbled street between pastel buildings hung with laundry.', ['#f2c230', '#e9a3a0', '#7fb3c8', '#d8cbb4']],
  ['Alfama rooftops at golden hour.jpg', 'A jumble of terracotta rooftops and white church towers tumbling down to a glittering river at golden hour.', ['#c4623a', '#f2c48d', '#f7f2ea', '#5e8fb3']],
  ['Pastéis de nata at the bakery.jpg', 'A tray of blistered golden custard tarts dusted with cinnamon on a marble bakery counter.', ['#e3a33b', '#7a4a1f', '#f3e7d3', '#ffffff']],
  ['Belém Tower.jpg', 'An ornate white limestone fortress tower with carved turrets standing at the edge of a sparkling blue river.', ['#e8dfcf', '#5a8fbf', '#9aa7a0', '#f7f4ee']],
  ['Azulejo tiles close-up.jpg', 'Close-up of hand-painted blue and white ceramic tiles with swirling floral patterns on an old facade.', ['#1f4e9a', '#f4f4f0', '#6f95cf', '#c9b48a']],
  ['Street murals in Alcântara.jpg', 'A huge colourful street mural of a fish made of scrap metal and plastic on the side of an old warehouse.', ['#e04b3a', '#3a8fc1', '#f2c230', '#5a5a5a']],
  ['Sintra palace in the mist.jpg', 'A hilltop romantic palace painted bright yellow and red, wrapped in morning mist and dense green forest.', ['#e8b830', '#b8322a', '#4f7a4a', '#d4dde0']],
  ['Sunset from the miradouro.jpg', 'A crowd silhouetted at a hilltop viewpoint watching the sun set over a city of rooftops and a suspension bridge.', ['#f08a4b', '#7a3b5e', '#2a2238', '#f7c873']],
  ['Grilled sardines dinner.jpg', 'Charred grilled sardines with boiled potatoes, peppers and a carafe of white wine on a checked tablecloth outdoors.', ['#8a8f96', '#e9d9a8', '#c43c2c', '#f4f1ea']],
  ['Cascais beach day.jpg', 'A small golden beach in a sheltered cove with colourful fishing boats and turquoise water.', ['#e8cf9a', '#2fa3b8', '#f4f7f5', '#d1493b']],
]), '2025-07-12 09:00')

const kyoto = dir('2026 Kyoto', [
  // Dated to match the itinerary in Documents\Travel Plans\Kyoto 2026 itinerary.docx.
  photo('Fushimi Inari gates at dawn.jpg', 'An endless tunnel of vermilion torii gates climbing a forested hillside in soft dawn light, the stone path glistening and empty.', ['#d9451c', '#f2a65a', '#2f3b2a', '#e8dcc4'], { at: '2026-04-04 06:18' }),
  photo('Nishiki Market skewers.jpg', 'Close-up of grilled seafood skewers and rolled omelette on a busy market counter under warm paper lanterns.', ['#c8692f', '#f2d27a', '#3a2a22', '#e84a3b'], { at: '2026-04-04 12:41' }),
  photo('Ryokan breakfast tray.jpg', 'A lacquered tray of grilled fish, miso soup, pickles and rice in small ceramic bowls on a tatami mat.', ['#8a2c22', '#e9dcc0', '#3d3a2f', '#c9a25a'], { at: '2026-04-05 07:52' }),
  photo('Bamboo grove, Arashiyama.jpg', 'Towering green bamboo stalks rising on both sides of a narrow path, sunlight filtering down in pale shafts.', ['#5c8a3a', '#a9c77a', '#2b3d1f', '#e6edd0'], { at: '2026-04-05 08:36' }),
  photo('Moss garden, Okochi Sanso.jpg', 'A carpet of emerald moss beneath maple trees with a winding stone path and a small thatched gate.', ['#3f6b2a', '#8fb35a', '#6b4f3a', '#d7e2c2'], { at: '2026-04-05 10:22' }),
  photo('Hozu river boat ride.jpg', 'A flat wooden boat gliding down a jade-green river between steep forested gorge walls dotted with pink blossom.', ['#2f7f6a', '#7aa35a', '#f2b8c6', '#5a4632'], { at: '2026-04-05 14:05' }),
  photo('Family selfie on the Togetsukyo Bridge.jpg', 'Three smiling travellers — a woman, a bearded man and a teenage girl — leaning together on a long wooden bridge with misty mountains behind.', ['#6b7f8f', '#e9c9b0', '#3b3f2f', '#f2b8c6'], { at: '2026-04-05 16:47' }),
  photo("Philosopher's Path cherry blossoms.jpg", 'A narrow canal lined with cherry trees in full pink bloom, petals drifting onto the water beside a stone walkway.', ['#f4c2d0', '#8fa9b8', '#5a4a3f', '#fdf1f4'], { at: '2026-04-06 09:14' }),
  photo('Tea ceremony.jpg', 'Hands whisking bright green matcha in a rough ceramic bowl in a tatami room lined with paper screens.', ['#6f9a3a', '#e8dcc0', '#3a2f26', '#b89a6a'], { at: '2026-04-06 15:20' }),
  photo('Nara deer bowing.jpg', 'A spotted deer bowing its head toward a laughing teenage girl holding out a rice cracker in a sunlit park.', ['#a9774a', '#5f8f3e', '#f2e6cf', '#d9a6b3'], { at: '2026-04-07 10:31' }),
  photo('Todai-ji great hall.jpg', 'The massive dark-timber hall of a Buddhist temple with sweeping curved roofs and golden ridge ornaments under a blue sky.', ['#3b2a20', '#c9a23a', '#8fb8de', '#e9e2d4'], { at: '2026-04-07 13:02' }),
  photo('Kyoto Station atrium.jpg', 'A vast steel-and-glass station atrium with a grid of geometric frames and escalators climbing toward the sky.', ['#9aa7b4', '#e8eef2', '#3a4652', '#c9d6e2'], { at: '2026-04-08 11:15' }),
  photo('Carpentry tools museum, Kobe.jpg', 'A museum display of antique Japanese hand planes, pull saws and chisels laid out on pale wood under soft spotlights.', ['#c9a77a', '#3a2f26', '#e9e0d0', '#7a5a3a'], { at: '2026-04-09 11:48' }),
  photo('Kiyomizu-dera at sunset.jpg', 'A wooden temple terrace on tall timber stilts glowing orange against a sunset sky above a sea of trees.', ['#e07a3f', '#7a3b2e', '#f6c177', '#3e4a5c'], { at: '2026-04-10 17:56' }),
  photo('Gion lanterns at night.jpg', 'A rain-slicked lane of wooden townhouses lit by red paper lanterns at night, reflections shimmering on the stones.', ['#b8282a', '#2a1f1c', '#f2a65a', '#5a4a42'], { at: '2026-04-10 21:09' }),
], '2026-04-03 09:00')

const graduation = dir('Elena Graduation 2026', album('2026-06-13 10:00', '2026-06-13 21:30', [
  ['Walking across the stage.jpg', 'A young woman in a navy graduation gown and cap shaking hands on a stage under bright gymnasium lights.', ['#1f2f5a', '#f2d36b', '#e9e6e0', '#6d6d6d']],
  ['Cap toss.jpg', 'Dozens of navy mortarboards flying into a clear blue sky above a crowd of cheering graduates on a football field.', ['#1f2f5a', '#7fb6e8', '#3f8f3a', '#ffffff']],
  ['With Grandma Lucia.jpg', 'An elderly woman in a floral dress hugging a beaming young graduate in a navy gown on a sunny lawn.', ['#1f2f5a', '#e88fa0', '#5f9a3e', '#f6efe4']],
  ['Family photo by the oak tree.jpg', 'A family of three — a woman, a bearded man and their daughter in a navy gown — posing under a large oak tree.', ['#3f6b2a', '#1f2f5a', '#c8a97e', '#f2efe9']],
  ['Diploma close-up.jpg', 'Close-up of a cream diploma in a navy leather folder held by hands with freshly painted nails.', ['#f2ead8', '#1f2f5a', '#c9a23a', '#e9c9b0']],
  ['Graduation party - backyard.jpg', "String lights over a backyard party with a long walnut table full of food and a banner reading 'Congrats Grad'.", ['#f2c96b', '#5b3a24', '#4f7a4a', '#f6efe4']],
  ['Cake - future architect.jpg', 'A white sheet cake topped with a fondant drafting compass, a tiny model house and the words "Future Architect".', ['#ffffff', '#1f2f5a', '#c9a23a', '#e88fa0']],
  ['Elena with her portfolio.jpg', 'A young woman in a navy gown holding open a black architecture portfolio full of hand-drawn building elevations.', ['#1b1b1b', '#1f2f5a', '#f2efe9', '#9a8a74']],
]), '2026-06-13 09:30')

const holidays = dir('Holidays 2025', [
  photo('Thanksgiving table.jpg', 'A long dining table set for twelve with a golden roast turkey, candles and autumn leaves down the centre.', ['#c8862f', '#7a3b1f', '#f2e6cf', '#4f6b3a'], { at: '2025-11-27 16:42' }),
  photo('Pie lineup.jpg', 'Three homemade pies — pumpkin, pecan and apple lattice — lined up on a wooden counter.', ['#d9822b', '#7a4a1f', '#e9c98a', '#f4efe4'], { at: '2025-11-27 19:15' }),
  photo('Decorating the tree.jpg', 'A teenage girl on a step stool placing a glass star on top of a tall Christmas tree in a cosy living room.', ['#2f5a3a', '#e8c35a', '#b8322a', '#f2e6d8'], { at: '2025-12-06 18:30' }),
  photo('Gingerbread workshop.jpg', 'A detailed gingerbread model of a timber-framed workshop with icing snow and tiny candy tools.', ['#a8642f', '#ffffff', '#d9443a', '#5fa35a'], { at: '2025-12-13 15:05' }),
  photo('Snowy front porch.jpg', 'A front porch dusted with fresh snow, a green wreath on a persimmon-red door and lanterns glowing beside the steps.', ['#f4f6f8', '#c4532d', '#2f5a3a', '#f2c96b'], { at: '2025-12-19 08:12' }),
  photo('Victor playing carols.jpg', 'A bearded man playing guitar by a crackling fireplace while family members sing along holding mugs.', ['#b5651d', '#f2a65a', '#3a2a22', '#e9d9c4'], { at: '2025-12-24 20:40' }),
  photo('Christmas morning.jpg', 'Torn wrapping paper and ribbons scattered under a glowing tree, a golden retriever nosing into an open box.', ['#b8322a', '#2f5a3a', '#d9a441', '#f2e6d8'], { at: '2025-12-25 08:55' }),
  photo("New Year's Eve sparklers.jpg", "Three people writing bright sparkler trails against a dark night sky in a snowy backyard.", ['#0f1530', '#f2d36b', '#ffffff', '#5a6a9a'], { at: '2025-12-31 23:58' }),
], '2025-11-27 09:00')

const garden = dir('Garden', album('2026-05-20 08:00', '2026-10-18 17:00', [
  ['Raised beds in June.jpg', 'Four cedar raised beds bursting with lettuce, beans and young tomato plants under bright morning sun.', ['#6f9a3a', '#b5823a', '#f2e6cf', '#3a5a2a']],
  ['Tomato harvest.jpg', 'A wicker basket overflowing with red, orange and striped heirloom tomatoes on a weathered garden table.', ['#d9302a', '#f28c28', '#6f9a3a', '#c9b08a']],
  ['Dahlias in bloom.jpg', 'Huge blush-pink and cream dahlia flowers with dew on their petals against dark green foliage.', ['#f2c4b8', '#f4ead8', '#2f5a3a', '#c86a7a']],
  ['Bee on lavender.jpg', 'A fuzzy bumblebee feeding on a purple lavender spike, shot close-up with a soft green background.', ['#7a5ab8', '#e8b830', '#8fb35a', '#2a2a2a']],
  ['Garden plan sketch.jpg', 'A hand-drawn garden plan on graph paper with coloured-pencil beds, arrows and planting notes.', ['#f5f1e8', '#5f8f4e', '#d97b4a', '#3a5a9a']],
  ['Pumpkins on the vine.jpg', 'Three orange pumpkins ripening among sprawling vines and big yellowing leaves in late-season light.', ['#e2711d', '#6f8f3a', '#e8c35a', '#4a3a2a']],
  ['Autumn cleanup.jpg', 'A wheelbarrow piled with spent vines and fallen maple leaves beside freshly mulched empty beds.', ['#c0281f', '#e8a33b', '#6b4a2f', '#8a8f6a']],
]), '2023-04-15')

const homePhotos = dir('Home', album('2025-09-01 08:00', '2026-09-30 18:00', [
  ['Kitchen before renovation.jpg', 'A dated kitchen with honey-oak cabinets, beige laminate counters and a fluorescent ceiling light.', ['#c99a5b', '#e6d8b8', '#f2efe0', '#8a7a5a']],
  ['Living room after repaint.jpg', 'A bright living room in warm grey with a linen sofa, a walnut coffee table and a tall fiddle-leaf fig.', ['#b7b2a8', '#e9e4da', '#5b3a24', '#4f7a4a']],
  ['Reading nook.jpg', 'A window seat piled with cushions and books, soft rain on the glass and a reading lamp glowing.', ['#d9d2c4', '#6f7f8f', '#f2c96b', '#8a5a3a']],
  ['Front door - new paint.jpg', 'A freshly painted persimmon-red front door with brass hardware, flanked by potted boxwoods.', ['#d0532d', '#c9a23a', '#2f5a3a', '#efe9df']],
  ['Biscuit on the sofa.jpg', 'A golden retriever sprawled upside down across a linen sofa, tongue out, in afternoon light.', ['#d9a441', '#e9e4da', '#8a6a4a', '#f6efe4']],
  ['Home office setup.jpg', 'A compact home office with a standing desk, two monitors showing spreadsheets, and a pegboard of neatly hung tools.', ['#2b2b2b', '#e9e5dc', '#2f6f5e', '#c8a97e']],
]), '2022-10-02')

export const pictures: SeedFolder = dir('Pictures', [
  cameraRoll,
  dir('Family', [graduation, holidays], '2023-11-25'),
  garden,
  homePhotos,
  screenshots,
  dir('Travel', [lisbon, kyoto], '2025-07-12 08:00'),
], '2022-09-03 10:41')
