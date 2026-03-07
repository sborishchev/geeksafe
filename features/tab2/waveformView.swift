import SwiftUI

struct WaveformView: View {
    @State private var phase: CGFloat = 0
    var color: Color = .blue
    
    var body: some View {
        // TimelineView makes the animation smooth (60fps)
        TimelineView(.animation) { timeline in
            Canvas { context, size in
                let now = timeline.date.timeIntervalSinceReferenceDate
                let angle = now * 5 // Speed of the wave
                
                let path = Path { p in
                    let midHeight = size.height / 2
                    let width = size.width
                    
                    p.move(to: CGPoint(x: 0, y: midHeight))
                    
                    for x in stride(from: 0, to: width, by: 2) {
                        let relativeX = x / width
                        // This math creates the "heartbeat" pulse look
                        let sine = sin(relativeX * 15 + angle)
                        let y = midHeight + (sine * 15 * sin(angle * 0.5)) 
                        p.addLine(to: CGPoint(x: x, y: y))
                    }
                }
                context.stroke(path, with: .color(color), lineWidth: 2)
            }
        }
    }
}