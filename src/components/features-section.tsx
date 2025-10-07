import Image from 'next/image'

export function FeaturesSection() {
  const features = [
    {
      title: "Ask & Practice Questions",
      description:
        "Chat with Leoqui just like you would with a classmate or tutor. Ask anything, get clear explanations instantly, and follow up with tailored practice problems that sharpen understanding topic by topic.",
      image: "/Mask group 1.png",
      imagePosition: "right",
      bgColor: "",
    },
    {
      title: "A Homework Help Buddy",
      description:
        "Upload assignments or tricky questions and receive step-by-step guidance without giving away the answers. Leoqui breaks tasks into manageable steps so students stay engaged while learning how to solve problems on their own.",
      image: "/Mask group 2.png",
      imagePosition: "left",
      bgColor: "bg-gradient-to-br from-blue-400 to-[#714B90]",
    },
    {
      title: "Study Notes for revisions",
      description:
        "Turn classroom materials into polished summaries in seconds. Generate concise revision notes, highlight key formulas, and bookmark insights so exam prep feels organised instead of overwhelming.",
      image: "/Mask group 3.png",
      imagePosition: "right",
      bgColor: "bg-gradient-to-br from-yellow-400 to-orange-500",
    },
    {
      title: "Flash Cards and many more",
      description:
        "Create interactive flash cards, mind maps, and study playlists tailored to each learner. Leoqui keeps revision fresh with smart spaced repetition and creative study formats that stick.",
      image: "/Mask group 4.png",
      imagePosition: "left",
      bgColor: "bg-white",
    },
    {
      title: "Take Quiz to check progress",
      description:
        "Measure mastery with adaptive quizzes that adjust to confidence levels. Instantly see strengths, close knowledge gaps, and celebrate milestones as you advance through your learning journey.",
      image: "/Mask group 5.png",
      imagePosition: "right",
      bgColor: "bg-gradient-to-br from-green-400 to-teal-500",
    },
  ]

  return (
    <section className="w-full px-6 py-12 bg-[#FFFBF2]">
      <div className="max-w-6xl mx-auto space-y-12">
        {features.map((feature, index) => (
          <div key={index} className="grid md:grid-cols-2 gap-8 items-center">
            {feature.imagePosition === "left" ? (
              <>
                <div className={"flex items-center justify-center"}>
                  <Image
                    src={feature.image || "/placeholder.svg"}
                    alt={feature.title}
                    width={240}
                    height={160}
                    className="max-w-xs w-full h-auto object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-4xl font-bold text-gray-900 mb-4 text-balance">{feature.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-4xl font-bold text-gray-900 mb-4 text-balance">{feature.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
                <div className={"flex items-center justify-center"}>
                  <Image
                    src={feature.image || "/placeholder.svg"}
                    alt={feature.title}
                    width={240}
                    height={160}
                    className="max-w-xs w-full h-auto object-contain"
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
