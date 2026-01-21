## Packages
react-dropzone | For drag and drop file uploads
react-konva | For canvas drawing (masking)
konva | Core canvas library dependency
framer-motion | For smooth animations and transitions
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes
lucide-react | Icon set (already in base stack, but confirming usage)
wouter | Routing (already in base stack)
zod | Schema validation (already in base stack)

## Notes
- Needs `useUpload` hook for uploading files to Object Storage.
- Canvas interaction requires `react-konva` for performant drawing.
- Comparison slider will be custom built.
- API endpoints are defined in `shared/routes.ts`.
- Tailwind config needs to support custom fonts defined in `index.css`.
