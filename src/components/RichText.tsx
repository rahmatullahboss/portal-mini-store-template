import React from 'react'

interface RichTextProps {
  content: any
}

const RichText: React.FC<RichTextProps> = ({ content }) => {
  if (!content) return null

  return (
    <div className="prose max-w-none">
      {Array.isArray(content) &&
        content.map((node, index) => {
          if (typeof node === 'string') {
            return <p key={index}>{node}</p>
          }

          if (typeof node === 'object' && node !== null) {
            switch (node.type) {
              case 'h1':
                return (
                  <h1 key={index} className="text-3xl font-bold mt-6 mb-4">
                    {renderChildren(node.children)}
                  </h1>
                )
              case 'h2':
                return (
                  <h2 key={index} className="text-2xl font-bold mt-5 mb-3">
                    {renderChildren(node.children)}
                  </h2>
                )
              case 'h3':
                return (
                  <h3 key={index} className="text-xl font-bold mt-4 mb-2">
                    {renderChildren(node.children)}
                  </h3>
                )
              case 'h4':
                return (
                  <h4 key={index} className="text-lg font-bold mt-3 mb-2">
                    {renderChildren(node.children)}
                  </h4>
                )
              case 'h5':
                return (
                  <h5 key={index} className="text-base font-bold mt-3 mb-1">
                    {renderChildren(node.children)}
                  </h5>
                )
              case 'h6':
                return (
                  <h6 key={index} className="text-sm font-bold mt-3 mb-1">
                    {renderChildren(node.children)}
                  </h6>
                )
              case 'p':
                return (
                  <p key={index} className="mb-4">
                    {renderChildren(node.children)}
                  </p>
                )
              case 'ul':
                return (
                  <ul key={index} className="list-disc pl-5 mb-4">
                    {renderChildren(node.children)}
                  </ul>
                )
              case 'ol':
                return (
                  <ol key={index} className="list-decimal pl-5 mb-4">
                    {renderChildren(node.children)}
                  </ol>
                )
              case 'li':
                return (
                  <li key={index} className="mb-1">
                    {renderChildren(node.children)}
                  </li>
                )
              case 'link':
                return (
                  <a
                    key={index}
                    href={node.url}
                    target={node.newTab ? '_blank' : '_self'}
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {renderChildren(node.children)}
                  </a>
                )
              case 'relationship':
                // Handle relationship nodes if needed
                return null
              case 'upload':
                // Handle upload nodes if needed
                return null
              default:
                return <p key={index}>{renderChildren(node.children || node.text || '')}</p>
            }
          }

          return null
        })}
    </div>
  )
}

const renderChildren = (children: any) => {
  if (!children) return null

  return Array.isArray(children)
    ? children.map((child, index) => {
        if (typeof child === 'string') {
          return child
        }

        if (typeof child === 'object' && child !== null) {
          if (child.bold) {
            return <strong key={index}>{child.text}</strong>
          }
          if (child.italic) {
            return <em key={index}>{child.text}</em>
          }
          if (child.underline) {
            return <u key={index}>{child.text}</u>
          }
          if (child.strikethrough) {
            return <s key={index}>{child.text}</s>
          }
          if (child.code) {
            return (
              <code key={index} className="bg-gray-100 px-1 py-0.5 rounded">
                {child.text}
              </code>
            )
          }
          return child.text || ''
        }

        return child
      })
    : children
}

export default RichText
