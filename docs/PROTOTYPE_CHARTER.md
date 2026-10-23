# 3dir — Autonomous Prototype Mission & Product Charter

**Version:** 1.1  
**Repository:** https://github.com/vdcoder/3dir  
**Product promise:** **Your files. Your world.**  
**Authority:** This document is the **single product-direction and acceptance-criteria file** for the initial prototype. Read it before planning, design, implementation, and progress reporting. No reference images or other product briefs are required.

---

## 1. The mission

Build an exceptional, working, browser-based **spatial file explorer** demonstrating a substantially better way to experience an ordinary computer's files.

Our target reaction from somebody seeing the demo for the first time:

> “This is MUUUCH better than Explorer. How come this isn't already a thing? This is the future.”

That reaction must come from **delight, immediate understanding, orientation, and a genuine practical advantage**, not novelty alone.

**Product hypothesis:** Spatial representation, meaningful visual landmarks, and intelligently exposed hierarchy can make files easier to **find, recognize, understand, and remember** than a conventional directory tree—without sacrificing the precision of a traditional explorer.

**This is an information tool, not a game, a virtual tour, or a 3D asset showcase.** Every major visual decision should help answer: *Where am I? What is here? What matters? Where is that thing I remember? What can I do next?*

Two nonnegotiable standards apply simultaneously:

1. The world must be visually compelling, coherent, distinctive, and polished enough to invite exploration.
2. File finding and navigation must be genuinely useful and demonstrably better in at least one important scenario.

A gorgeous but unusable diorama fails. A functional explorer filled with gray cubes also fails.

**North-star test:** Within a minute of opening 3dir, a first-time visitor should understand what it does. After a three-minute demo, they should want to use it for their own files.

## 2. Design philosophy — a place, not just a list

We are turning a filesystem into a **memorable place**, not mechanically rendering every directory as an identically sized building.

Think of the disk as a coherent landscape, major categories as recognizable districts, significant directories as buildings or interior spaces, and files as identifiable objects. Represent **informational importance**, not just hierarchy depth, folder size, or item count.

The world should provide:

- **Recognition instead of recollection:** familiar, distinctive landmarks are easier to recognize than deep paths.
- **Spatial memory:** stable locations make revisiting important content intuitive.
- **Hierarchy at a glance:** expose important nested destinations without expanding every intermediary folder.
- **Context:** communicate what surrounds and relates to the selected item.
- **Precision:** every spatial entity retains a real, inspectable canonical path and clear correspondence to the 2D explorer.

Conventional navigation and search should always remain available. The world complements them; it does not imprison users inside 3D interactions.

## 3. Written art direction — the two guiding visual concepts

**There are no reference images.** These descriptions are the complete art-direction brief. They explain not just what should look attractive, but *why that visual style serves the information task*.

### Concept A: A crafted isometric miniature architectural world

Imagine a meticulously art-directed **miniature town or architectural diorama** viewed from an elevated three-quarter, isometric-like camera. From one comfortable viewpoint, the visitor sees several differentiated districts and buildings, walkways or courtyards, meaningful landmarks, attractive materials, restrained vegetation where appropriate, intentional lighting, depth, shadows, and clear signage. Buildings may be **roofless, open-sided, or cut away**, revealing useful internal spaces. Everything feels assembled into a coherent, recognizable world rather than scattered procedurally.

**Why this is the right metaphor:**

- Major districts make top-level folders recognizable immediately.
- Buildings and interior rooms turn nested hierarchy into understandable spatial relationships.
- Open roofs and courtyards let users see important descendants from above without exhausting sequences of folder clicks.
- Distinct landmarks give users spatial memory anchors; on their next visit they may remember “the archive beside the workshop” instead of recalling a six-component path.
- The miniature scale presents multiple meaningful destinations simultaneously and encourages exploration without forcing first-person travel.

**The information-tool requirement:** The opening scene must function as a readable **map of the user's information**. Do not make the largest directories the largest buildings merely because they consume more storage. The Windows and Program Files structures should not visually dominate personal Documents, Projects, or prominent business information. A deeply nested, important location can have a visually promoted entrance or exposed interior on the top-level map, but the real path must remain clear. Environmental labels and click targets must be readable. Architecture must **reveal hierarchy**, not conceal it behind decorative façades.

### Concept B: A beautiful, legible miniature interior

Imagine entering an open-roof or cutaway **library, modern office, research studio, design workshop, or laboratory**. It is a richly detailed room or cluster of rooms seen from an elevated angle, with identifiable shelves, books, binders, cabinets, desks, tables, project boards, screens, display objects, and sensible groups of items. The lighting, material palette, and furniture tell the visitor what kind of information lives there. Shapes are distinctive; the composition is calm enough to read. Small details reward inspection, but they do not drown out the important items.

**Why this is the right metaphor:**

- Different *kinds of information* become visually recognizable instead of appearing as many identical file icons.
- Stable arrangements of furniture and content make locations memorable.
- Rooms and objects add **context**: a budget beside financial reports, a design next to project artifacts, photographs in an album-oriented area.
- Clear architectural cutaways preserve orientation between overview and detailed navigation.
- Beautiful interiors reward the moment of opening a directory: discovery should feel better, not merely slower, than opening a list.

**The information-tool requirement:** Specific files must remain **selectable, distinguishable, and inspectable**. A spreadsheet still needs its filename, type, path, metadata, and preview, even if its 3D representation is a ledger or binder. A business area might use archives and ledgers; a software area might use desks and project displays; personal content might use albums and library shelving. Use subtle grouping and labeling rather than decorative clutter. The viewer must be able to find and open an individual file, not just admire the room.

### Bringing both concepts together

The overarching world and its detailed interiors must share **one cohesive art direction**. Our target is a sophisticated, welcoming, highly usable information instrument: a beautifully designed product with excellent typography, clear state and selection feedback, consistent materials, stable paths, and efficient navigation.

**Avoid:** photorealistic game scenery that consumes resources without improving file finding; Minecraft-like cubes; arbitrary props; cramped corridors; unreadable labels; gimmicky physics; wildly inconsistent art styles; ornamental complexity masking important information.

Use architectural beauty **to explain where information lives**. Use detailed interiors **to make that information recognizable**. Use spatial consistency **to make it memorable**.

**Prioritization rule:** One extraordinary, fully navigable, memorable flagship district plus two simpler but coherent supporting districts is preferable to three mediocre, unfinished districts. Visual quality is a first-class deliverable, not optional polish.

## 4. The synthetic computer

Create a deterministic, rich enough **fictional Windows-style filesystem** recognizable to a desktop user:

- `C:\Windows` and `C:\Program Files`: present and accessible, visually compact and lower prominence.
- `C:\Users`: several fictional user accounts (for example, Amanda, Victor, Elena, Guest).
- Personal `Documents`, `Downloads`, `Desktop`, `Pictures`, `Projects` and deeply nested collections.
- Realistic files: text documents, reports, spreadsheets, PDFs, photographs, archives, code and design projects, with plausible metadata and lightweight preview content.
- A simulated **OneDrive** containing fictional business folders such as Finance, Budgets, Reports, Contracts, Operations and Forecasts.

Make the synthetic dataset broad and deep enough for meaningful tasks, but curated for impressive demonstrations. Use stable node IDs and canonical paths.

**No actual filesystem access, private files, real cloud accounts, account credentials, network sync, or destructive operations.** Clearly label the dataset as fictional.

## 5. Two independently useful interfaces

### Conventional 2D explorer

Provide a polished folder tree, file listing, breadcrumbs, path display, selection state, file metadata, basic preview and practical find/search. It must function on its own.

### Spatial explorer

Start with a polished **isometric or elevated three-quarter overview** optimized for visual comprehension. Support comfortable pan, zoom and rotate, selection, hover feedback, entering/focusing locations, going to parent, clear breadcrumbs or wayfinding, and smooth transitions. Where needed, use roofless/cutaway architecture and legible signage.

**An immersive first-person camera is optional.** Implement it only if the overview, file interactions and visual quality are already excellent. Do not make physics, avatars, collision logic, or game controls project dependencies.

### Synchronization semantics

Both interfaces show one underlying canonical dataset.

- Navigating to a folder in the world expands/navigates to it in the conventional explorer.
- Selecting an item in the conventional explorer highlights/identifies its spatial counterpart.
- Selecting a spatial object identifies/selects the conventional explorer item.
- **Selecting in 2D must not automatically teleport the 3D camera.**
- Explicit commands: **Show in World** and **Show in Explorer**.
- A visible **Linked navigation** toggle is **ON by default** and permits independent exploration when OFF.

Ensure consistent meanings for *selection*, *current folder*, *tree expansion*, and *camera focus*.

## 6. The differentiator — intelligently visible nested hierarchy

**Do not simply draw the current directory and one child level at a time.** A key hypothesis is that a spatial representation can expose **important descendants from an ancestor's overview** while retaining context.

Example: at `C:\`, the visitor might immediately see recognizable personal or projects destinations several levels under `C:\Users\...`, while the much larger Windows/system areas occupy smaller, quieter structures.

Implement deterministic **importance-weighted spatial mapping**, initially driven by curated importance values or simple rules—no LLM required.

Acceptance rules:

- Important deeply nested destinations can be visually promoted.
- The user can always inspect their **actual path and parent**.
- Entities retain stable canonical IDs; layout remains stable between visits/renders.
- Size and prominence must not blindly follow byte count, number of entries, or raw depth.
- Important destinations are visually distinct, legible, reachable, and not buried behind opaque geometry.
- Promote selectively; never overcrowd the map with every possible descendant.

**Demo proof:** Reaching an important deeply nested folder through the spatial overview should feel visibly easier or more natural than traversing each intermediate folder in the 2D tree.

## 7. One dataset, multiple representations

Keep **canonical filesystem data**, **visualization/mapping configuration**, and **rendering and interaction** separate.

A view is a presentation of the same underlying information, not a copy of the files and not a different physical directory tree. If there is time without sacrificing the flagship experience, provide two selectable visual configurations (for example, imaginative personal versus restrained professional).

Future extensions to accommodate architecturally—but **not implement now**—include multiple spatial references to one canonical file, virtual rearrangement without moving real file paths, shared/company views, privacy and real authorization, uncategorized/inbox areas, semantic AI-assisted mapping, AI memory and MCP tools.

Do not pretend a client-side “private/public” view is actual access-control enforcement.

## 8. Technical and asset direction

Recommended approach: **React + TypeScript + Three.js / React Three Fiber**, with a straightforward frontend build system and no required backend. You may select alternatives if they clearly improve delivery and maintainability.

- Typed canonical data model and deterministic synthetic seed.
- Data-driven spatial mapping and consistent selection/navigation state.
- Reasonable performance on a typical modern desktop browser.
- Local, reproducible install/build/run workflow.
- No database, authentication, runtime LLM, real OneDrive integration, production indexer or paid deployment.

For the art: use coherent, high-quality **textured 3D assets** for distinctive buildings, furniture and landmarks. Procedural geometry is sensible for basic walls, floors, structural parts and layout. **Do not use Blender for manual modeling.** AI-generated assets may come from Meshy, Tripo or another suitable provider; validate **one full generate → download → import → render → browser inspect** cycle before committing to a service. Record licenses/attribution and cost. Never purchase credits, add billing, enable overages or expose API keys without explicit approval.

## 9. Budget, autonomy and constraints

This is a **$300 all-in initial experiment**, including existing agent subscription costs and any additional service costs, not a fresh $300 spending authorization. Require approval for **every new charge** and track estimated/actual expenses.

The implementation agent is empowered to make routine implementation and design decisions without asking for approval. Escalate only actual spending, credentials, major scope conflicts, or irreversible product decisions. If a service is blocked or unavailable, choose an in-scope free alternative and document it.

Do not assume a continuous five-day cloud session. Work in coherent milestones and keep sufficient project state in the repository to resume after usage limits, environment recycling or agent interruption.

## 10. Implementation milestones

1. **Foundation:** synthetic filesystem, usable 2D explorer, typed data model, renderable spatial scene and basic navigation.
2. **Spatial intelligence:** stable hierarchy mapping, visually promoted nested destinations, camera movement, selection and linked navigation.
3. **Flagship visual craft:** one exceptional district and cutaway interior, recognizable file objects, lighting, signage, materials, coherent composition.
4. **Supporting content:** two simpler finished destinations, previews, compelling end-to-end demo route, optional alternate visualization.
5. **Demo readiness:** cross-interface testing, in-browser visual defect correction, documentation, honest limitations and real screenshots.

Target an initial demonstration in **2–5 days**, subject to actual cloud-agent session and usage availability. This is an aspiration rather than a delivery guarantee.

**Cut scope before cutting quality.** One outstanding end-to-end experience wins over many unfinished features.

## 11. Autonomous reporting and proof

At each **meaningful checkpoint/commit**:

1. Report **completed**, **tested**, **broken/unfinished**, and **next**.
2. Build and actually run the application in a browser. Test key interactions, ideally with browser automation such as Playwright.
3. Capture a handful of **real browser screenshots** for meaningful visual changes (never AI mockups presented as application screenshots). Store under `docs/progress/` or an equally durable repository-linked artifact location.
4. Maintain `docs/PROGRESS.md` with current status, outstanding defects, visual concerns, repeatable test steps, and budget/credit notes.
5. Keep `README.md` current with setup and running instructions; use `CLAUDE.md` for agent continuity if useful. **Do not create competing product specifications; this charter remains authoritative.**

A compiling application is not enough. **Inspect what renders.** Repair awkward scales, poor lighting, obstructed paths, illegible signs, missing feedback, broken selection or clumsy camera behavior.

## 12. Acceptance gates and suggested demo

The result is demo-ready only if:

- It builds/runs locally through documented commands.
- The fictional hierarchy feels real and clearly distinguishes personal, work and system content.
- Both explorer modes navigate and select actual synthetic nodes.
- Linked navigation, highlights and **Show in World / Show in Explorer** work predictably.
- Deeply nested important destinations are exposed from higher-level overviews while retaining real paths.
- The opening world is beautiful, recognizable, legible and responsive.
- The flagship interior is delightful *and* its content can be selected and previewed.
- Basic search/find and file metadata work.
- No blocking errors affect the primary demo journey.
- Known limitations and untested features are disclosed.

**Three-minute flagship walkthrough:**

1. Open `C:\` into a striking, intelligible miniature landscape.
2. Recognize major areas and notice an important personal/project destination already exposed despite deep nesting.
3. Select it and enter a crafted cutaway interior with distinguishable file representations.
4. Inspect a believable report or project file; see its canonical path and synchronized 2D selection.
5. Select another file through 2D, observe 3D identification, then intentionally use **Show in World**.
6. Find another item through search, orient in the world, and return to the overview.

The viewer should understand the path and destination **without someone narrating every click**.

## 13. Explicit non-goals for this prototype

Real filesystem/OneDrive integration; production security/roles; actual file deletion/editing; collaborative workspaces; AI content classification; AI chat agents; MCP; multiplayer; physics simulation; avatars; commercial billing; production indexing; complex settings and customization UIs.

## 14. Final instruction

**Treat 3dir as a serious information product whose visual language makes knowledge navigable.**

Architecture must **reveal relationships**. Interiors must **make information recognizable**. Stable locations must **support memory**. The conventional explorer must preserve familiar precision. Art and engineering must work together to make navigation *feel better*, not merely look different.

Build a result beautiful enough to stop people in their tracks, and genuinely useful enough that they immediately understand why it ought to exist.

**Do not just claim that 3dir is better than Explorer. Demonstrate the advantage.**
